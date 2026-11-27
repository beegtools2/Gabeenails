/// <reference types="node" />
import type { IncomingMessage } from 'http';
import type { Readable } from 'node:stream';

/** Tipos mínimos compatibles con el middleware de Vite y con Vercel Functions. */
export type ApiRequest = Pick<IncomingMessage, 'method' | 'url'> & Pick<Readable, 'on'> & {
  body?: any;
  waitUntil?: (work: Promise<unknown>) => void;
};

export type ApiResponse = {
  statusCode: number;
  setHeader(name: string, value: string): unknown;
  end(body: string): unknown;
};

export type ApiHandler = (req: ApiRequest, res: ApiResponse) => void | Promise<void>;

export function sendJson(res: ApiResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export function methodNotAllowed(res: ApiResponse, allowedMethod: string): void {
  res.statusCode = 405;
  res.setHeader('Allow', allowedMethod);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success: false, error: `Método no permitido. Usa ${allowedMethod}.` }));
}

/**
 * Vercel ya entrega `req.body` parseado; en Vite el body viene como stream.
 * `maxBytes` = 0 desactiva el límite (los endpoints de correo sin adjuntos).
 */
export async function readJsonBody(
  req: ApiRequest,
  maxBytes = 0
): Promise<{ data: any; tooLarge: boolean }> {
  const parse = (body: string) => {
    try {
      const data = JSON.parse(body);
      return data && typeof data === 'object' ? data : {};
    } catch {
      return {};
    }
  };

  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      if (maxBytes > 0 && Buffer.byteLength(req.body) > maxBytes) return { data: {}, tooLarge: true };
      return { data: parse(req.body), tooLarge: false };
    }
    return { data: req.body, tooLarge: false };
  }

  return new Promise((resolve) => {
    let body = '';
    let bytes = 0;
    let tooLarge = false;
    req.on('data', (chunk: string | Buffer) => {
      if (tooLarge) return;
      bytes += Buffer.byteLength(chunk);
      tooLarge = maxBytes > 0 && bytes > maxBytes;
      if (!tooLarge) body += chunk;
    });
    req.on('end', () => {
      if (tooLarge) {
        resolve({ data: {}, tooLarge: true });
        return;
      }
      resolve({ data: parse(body), tooLarge: false });
    });
    req.on('error', () => resolve({ data: {}, tooLarge: false }));
  });
}
