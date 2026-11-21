import type { ApiRequest, ApiResponse } from '../../server/http';
import { methodNotAllowed } from '../../server/http';
import { getTelegramService } from '../../server/telegram';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    methodNotAllowed(res, 'POST');
    return;
  }
  await getTelegramService().notifyRecharge(req, res);
}
