import type { ApiRequest, ApiResponse } from '../../server/http';
import { methodNotAllowed, sendJson } from '../../server/http';
import { getTelegramService } from '../../server/telegram';

export default function handler(req: ApiRequest, res: ApiResponse): void {
  if (req.method !== 'GET') {
    methodNotAllowed(res, 'GET');
    return;
  }
  const service = getTelegramService();
  // Sustituye al intervalo del plugin de Vite: el frontend ya consulta este endpoint.
  // No bloquea la respuesta para mantener el mismo tiempo de respuesta que antes.
  void service.pollOnceThrottled();
  sendJson(res, 200, service.actions());
}
