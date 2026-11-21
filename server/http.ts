/// <reference types="node" />
import type { IncomingMessage, ServerResponse } from 'http';

/** Tipos mínimos compatibles con el middleware de Vite y con Vercel Functions. */
export type ApiRequest = IncomingMessage & {
  body?: any;
  query?: any;
};

export type ApiResponse = ServerResponse & {
  status?: (statusCode: number) => ApiResponse;
  json?: (payload: unknown) => ApiResponse;
};

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
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      try {
        return { data: JSON.parse(req.body || '{}'), tooLarge: false };
      } catch {
        return { data: {}, tooLarge: false };
      }
    }
    return { data: req.body, tooLarge: false };
  }

  return new Promise((resolve) => {
    let body = '';
    let tooLarge = false;
    req.on('data', (chunk: any) => {
      if (tooLarge) return;
      body += chunk;
      if (maxBytes > 0 && Buffer.byteLength(body, 'utf8') > maxBytes) tooLarge = true;
    });
    req.on('end', () => {
      if (tooLarge) {
        resolve({ data: {}, tooLarge: true });
        return;
      }
      try {
        resolve({ data: JSON.parse(body || '{}'), tooLarge: false });
      } catch {
        resolve({ data: {}, tooLarge: false });
      }
    });
    req.on('error', () => resolve({ data: {}, tooLarge: false }));
  });
}
