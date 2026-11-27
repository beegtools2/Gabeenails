import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/server';
import { ADMIN_SESSION_ENDPOINT } from '../../data/adminSession.ts';
import { handleAdminSession, hasAdminSession } from './adminSession.ts';
import {
  defaultSiteImage,
  isSiteImageKey,
  SITE_IMAGES_ENDPOINT,
  SITE_IMAGE_MAX_BYTES,
  type SiteImageVersions,
} from '../../data/siteImages.ts';

const noCache = { 'Cache-Control': 'no-store' };

function imageType(bytes: ArrayBuffer): string | null {
  const signature = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 12));
  const matches = (offset: number, expected: number[]) =>
    expected.every((value, index) => signature[offset + index] === value);

  if (matches(0, [137, 80, 78, 71, 13, 10, 26, 10])) return 'image/png';
  if (matches(0, [255, 216, 255])) return 'image/jpeg';
  if (matches(0, [82, 73, 70, 70]) && matches(8, [87, 69, 66, 80])) return 'image/webp';
  return null;
}

async function readUpload(request: Request): Promise<ArrayBuffer | null> {
  if (Number(request.headers.get('content-length')) > SITE_IMAGE_MAX_BYTES) return null;
  if (!request.body) return new ArrayBuffer(0);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > SITE_IMAGE_MAX_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes.buffer;
}

export default async function handleSiteImages(request: Request, context: Context): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === ADMIN_SESSION_ENDPOINT) return handleAdminSession(request, context);
  if (url.pathname !== SITE_IMAGES_ENDPOINT) return new Response(null, { status: 404 });

  const key = url.searchParams.get('image');
  if (key !== null && !isSiteImageKey(key)) return new Response(null, { status: 404, headers: noCache });

  if (request.method !== 'GET' && request.method !== 'PUT' && request.method !== 'DELETE') {
    return new Response(null, { status: 405, headers: { ...noCache, Allow: 'GET, PUT, DELETE' } });
  }

  if (request.method !== 'GET' && (!key || request.headers.get('origin') !== context.url.origin)) {
    return new Response(null, { status: 403, headers: noCache });
  }

  const fallback = key ? new URL(defaultSiteImage(key), url) : null;
  const redirectToDefault = () => new Response(null, { status: 302, headers: { ...noCache, Location: fallback!.pathname } });

  try {
    if (request.method !== 'GET' && !(await hasAdminSession(request, context))) {
      return new Response(null, { status: 401, headers: noCache });
    }
    const store = getStore({
      name: context.deploy.context === 'production' ? 'site-images' : 'site-images-preview',
      consistency: 'strong',
    });

    if (request.method === 'GET') {
      if (!key) {
        const { blobs } = await store.list();
        const versions: SiteImageVersions = {};
        for (const blob of blobs) {
          if (isSiteImageKey(blob.key)) versions[blob.key] = blob.etag;
        }
        return Response.json(versions, { headers: noCache });
      }

      const image = await store.getWithMetadata(key, { type: 'arrayBuffer' });
      const contentType = image && imageType(image.data);
      if (!image || !contentType) return redirectToDefault();
      return new Response(image.data, {
        headers: {
          'Content-Type': contentType,
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': image.etag && url.searchParams.get('v') === image.etag
            ? 'private, max-age=604800, immutable'
            : 'no-store',
        },
      });
    }

    if (!key) return new Response(null, { status: 404, headers: noCache });
    if (request.method === 'DELETE') {
      await store.delete(key);
      return new Response(null, { status: 204, headers: noCache });
    }

    const bytes = await readUpload(request);
    if (!bytes) return new Response(null, { status: 413, headers: noCache });
    const type = imageType(bytes);
    if (!type || type !== request.headers.get('content-type')) {
      return new Response(null, { status: 415, headers: noCache });
    }

    const result = await store.set(key, bytes);
    return Response.json({ version: result.etag || String(Date.now()) }, { headers: noCache });
  } catch {
    if (request.method === 'GET' && fallback) return redirectToDefault();
    return new Response(null, { status: 503, headers: noCache });
  }
}

export const config: Config = { path: ['/api/site-images', '/api/admin-session'] };
