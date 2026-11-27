import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/server';
import {
  defaultSiteImage,
  isSiteImageKey,
  SITE_IMAGES_ENDPOINT,
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

export default async function handleSiteImages(request: Request, context: Context): Promise<Response> {
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

export const config: Config = { path: ['/api/site-images'] };
