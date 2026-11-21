import type { ApiRequest, ApiResponse } from '../server/http';
import { methodNotAllowed } from '../server/http';
import { handleSendPasswordReset } from '../server/emailHandlers';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    methodNotAllowed(res, 'POST');
    return;
  }
  await handleSendPasswordReset(req, res);
}
