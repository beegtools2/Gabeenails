import type { ApiRequest, ApiResponse } from '../../server/http';
import { methodNotAllowed, sendJson } from '../../server/http';
import { getTelegramService } from '../../server/telegram';

export default function handler(req: ApiRequest, res: ApiResponse): void {
  if (req.method !== 'GET') {
    methodNotAllowed(res, 'GET');
    return;
  }
  sendJson(res, 200, getTelegramService().status());
}
