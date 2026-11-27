import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/server';
import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import sendClaim from '../../api/libro-reclamaciones/send.ts';
import sendPasswordReset from '../../api/send-password-reset.ts';
import sendVerification from '../../api/send-verification.ts';
import telegramActions from '../../api/telegram/actions.ts';
import telegramAppointment from '../../api/telegram/appointment.ts';
import telegramRecharge from '../../api/telegram/recharge.ts';
import telegramStatus from '../../api/telegram/status.ts';
import telegramStoreOrder from '../../api/telegram/store-order.ts';
import type { ApiHandler, ApiRequest, ApiResponse } from '../../server/http.ts';
import {
  defaultSiteImage,
  isSiteImageKey,
  SITE_IMAGES_ENDPOINT,
  type SiteImageVersions,
} from '../../data/siteImages.ts';

const noCache = { 'Cache-Control': 'no-store' };

const apiRoutes: Record<string, ApiHandler> = {
  '/api/libro-reclamaciones/send': sendClaim,
  '/api/send-password-reset': sendPasswordReset,
  '/api/send-verification': sendVerification,
  '/api/telegram/actions': telegramActions,
  '/api/telegram/appointment': telegramAppointment,
  '/api/telegram/recharge': telegramRecharge,
  '/api/telegram/status': telegramStatus,
  '/api/telegram/store-order': telegramStoreOrder,
};

function imageType(bytes: ArrayBuffer): string | null {
  const signature = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 12));
  const matches = (offset: number, expected: number[]) =>
    expected.every((value, index) => signature[offset + index] === value);

  if (matches(0, [137, 80, 78, 71, 13, 10, 26, 10])) return 'image/png';
  if (matches(0, [255, 216, 255])) return 'image/jpeg';
  if (matches(0, [82, 73, 70, 70]) && matches(8, [87, 69, 66, 80])) return 'image/webp';
  return null;
}

async function handleSiteImages(request: Request, context: Context): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== SITE_IMAGES_ENDPOINT) return new Response(null, { status: 404 });

  const key = url.searchParams.get('image');
  if (key !== null && !isSiteImageKey(key)) return new Response(null, { status: 404, headers: noCache });

  if (request.method !== 'GET') {
    return new Response(null, { status: 405, headers: { ...noCache, Allow: 'GET' } });
  }

  const fallback = key ? new URL(defaultSiteImage(key), url) : null;
  const redirectToDefault = () => new Response(null, { status: 302, headers: { ...noCache, Location: fallback!.pathname } });

  try {
    const store = getStore({
      name: context.deploy.context === 'production' ? 'site-images' : 'site-images-preview',
      consistency: 'strong',
    });

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
  } catch {
    if (fallback) return redirectToDefault();
    return new Response(null, { status: 503, headers: noCache });
  }
}

export default async function handleApi(request: Request, context: Context): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === SITE_IMAGES_ENDPOINT) return handleSiteImages(request, context);

  const handler = apiRoutes[url.pathname];
  if (!handler) return new Response(null, { status: 404 });

  if (url.pathname.startsWith('/api/telegram/') && context.deploy.context !== 'production') {
    if (url.pathname === '/api/telegram/actions' && request.method === 'GET') {
      return Response.json({ actions: [] }, { headers: noCache });
    }
    return Response.json({ success: false, error: 'El bot de Telegram está reservado para producción.' }, {
      status: 503,
      headers: noCache,
    });
  }

  const stream = request.body
    ? Readable.fromWeb(request.body as unknown as NodeReadableStream<Uint8Array>, { encoding: 'utf8' })
    : Readable.from([]);
  const req: ApiRequest = Object.assign(stream, {
    method: request.method,
    url: url.pathname + url.search,
    waitUntil: (work: Promise<unknown>) => context.waitUntil(work),
  });
  const headers = new Headers(noCache);
  let body: string | null = null;
  const res: ApiResponse = {
    statusCode: 200,
    setHeader: (name, value) => headers.set(name, value),
    end: (payload) => { body = payload; },
  };

  try {
    await handler(req, res);
    return new Response(request.method === 'HEAD' ? null : body, { status: res.statusCode, headers });
  } catch {
    return Response.json({ success: false, error: 'El servicio no está disponible temporalmente.' }, {
      status: 503,
      headers: noCache,
    });
  }
}

export const config: Config = {
  path: [
    '/api/site-images',
    '/api/libro-reclamaciones/send',
    '/api/send-password-reset',
    '/api/send-verification',
    '/api/telegram/*',
  ],
};
