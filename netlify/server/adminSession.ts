import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/server';
import { ADMIN_PASSWORD_MAX_LENGTH, ADMIN_PASSWORD_MIN_LENGTH } from '../../data/adminSession.ts';

const derivePassword = promisify(scrypt);
const cookieName = '__Host-gabee-admin';
const sessionSeconds = 8 * 60 * 60;
const saltBytes = 16;
const hashBytes = 64;
const noCache = { 'Cache-Control': 'no-store' };

function getPanelPassword() {
  const password = process.env.ADMIN_PANEL_PASSWORD;
  if (!password || password.length < ADMIN_PASSWORD_MIN_LENGTH || password.length > ADMIN_PASSWORD_MAX_LENGTH) return null;
  return password;
}

function passwordStore(context: Context) {
  return getStore({
    name: context.deploy.context === 'production' ? 'admin-panel' : 'admin-panel-preview',
    consistency: 'strong',
  });
}

function verifierKey(password: string) {
  return `password-verifier-${createHmac('sha256', password).update('gabee-admin-password-version').digest('hex')}`;
}

async function readVerifier(password: string, context: Context): Promise<Buffer | null> {
  const saved = await passwordStore(context).get(verifierKey(password), { type: 'arrayBuffer' });
  if (saved === null) return null;
  const verifier = Buffer.from(saved);
  if (verifier.length !== saltBytes + hashBytes) throw new Error('Invalid admin password verifier');
  return verifier;
}

function signSession(payload: string, password: string, verifier: Buffer | null, context: Context) {
  return createHmac('sha256', password)
    .update(`gabee-admin-session\0${context.site.id}\0${context.deploy.context}\0${context.url.origin}\0${payload}\0`)
    .update(verifier ?? '')
    .digest();
}

function sessionResponse(password: string, verifier: Buffer | null, context: Context) {
  const payload = `${Date.now() + sessionSeconds * 1000}.${randomBytes(16).toString('base64url')}`;
  const signature = signSession(payload, password, verifier, context).toString('base64url');
  return cookieResponse(`${payload}.${signature}`, sessionSeconds);
}

function cookieResponse(value: string, maxAge: number) {
  return new Response(null, {
    status: 204,
    headers: {
      ...noCache,
      'Set-Cookie': `${cookieName}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`,
    },
  });
}

function sessionParts(request: Request) {
  const value = request.headers.get('cookie')?.split(';').map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  const parts = value?.match(/^(\d{13})\.([\w-]{22})\.([\w-]{43})$/);
  if (!parts || Number(parts[1]) <= Date.now()) return null;
  return { payload: `${parts[1]}.${parts[2]}`, signature: Buffer.from(parts[3], 'base64url') };
}

function sessionMatches(parts: NonNullable<ReturnType<typeof sessionParts>>, password: string, verifier: Buffer | null, context: Context) {
  return timingSafeEqual(parts.signature, signSession(parts.payload, password, verifier, context));
}

export async function hasAdminSession(request: Request, context: Context) {
  const parts = sessionParts(request);
  const password = getPanelPassword();
  if (!parts || !password) return false;
  return sessionMatches(parts, password, await readVerifier(password, context), context);
}

async function parsePassword(request: Request): Promise<string | null> {
  if (!request.body || !request.headers.get('content-type')?.startsWith('application/json')) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let body = '';
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 2048) {
      await reader.cancel();
      return null;
    }
    body += decoder.decode(value, { stream: true });
  }
  try {
    const password = JSON.parse(body + decoder.decode())?.password;
    return typeof password === 'string' && password.length >= ADMIN_PASSWORD_MIN_LENGTH && password.length <= ADMIN_PASSWORD_MAX_LENGTH
      ? password
      : null;
  } catch {
    return null;
  }
}

async function verifyPassword(input: string, password: string, verifier: Buffer | null) {
  if (verifier) {
    const derived = await derivePassword(input, verifier.subarray(0, saltBytes), hashBytes) as Buffer;
    return timingSafeEqual(derived, verifier.subarray(saltBytes));
  }
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(input), digest(password));
}

export async function handleAdminSession(request: Request, context: Context): Promise<Response> {
  const result = (status: number) => new Response(null, { status, headers: noCache });
  const { method } = request;
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(method)) {
    return new Response(null, { status: 405, headers: { ...noCache, Allow: 'GET, POST, PATCH, DELETE' } });
  }
  if (method !== 'GET' && request.headers.get('origin') !== context.url.origin) return result(403);
  if (method === 'DELETE') return cookieResponse('', 0);
  if (method === 'GET' && !process.env.ADMIN_PANEL_PASSWORD) {
    return Response.json({ mode: 'preview' }, { headers: noCache });
  }
  const password = getPanelPassword();
  if (!password) return result(503);

  try {
    if (method === 'GET') return result(await hasAdminSession(request, context) ? 204 : 401);
    if (method === 'POST') {
      const input = await parsePassword(request);
      if (input === null) return result(401);
      const verifier = await readVerifier(password, context);
      return await verifyPassword(input, password, verifier) ? sessionResponse(password, verifier, context) : result(401);
    }

    const parts = sessionParts(request);
    if (!parts || !sessionMatches(parts, password, await readVerifier(password, context), context)) return result(401);
    const input = await parsePassword(request);
    if (input === null) return result(400);
    const salt = randomBytes(saltBytes);
    const hash = await derivePassword(input, salt, hashBytes) as Buffer;
    const verifier = Buffer.concat([salt, hash]);
    await passwordStore(context).set(verifierKey(password), new Blob([new Uint8Array(verifier)]));
    return sessionResponse(password, verifier, context);
  } catch {
    return result(503);
  }
}
