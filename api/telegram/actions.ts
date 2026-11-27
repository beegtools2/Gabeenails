import type { ApiRequest, ApiResponse } from '../../server/http';
import { methodNotAllowed, sendJson } from '../../server/http';
import { getTelegramService } from '../../server/telegram';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    methodNotAllowed(res, 'GET');
    return;
  }
  const service = getTelegramService();
  const actions = await service.actions();
  const refresh = service.pollOnceThrottled();
  if (req.waitUntil) req.waitUntil(refresh);
  else await refresh;
  sendJson(res, 200, actions);
}
