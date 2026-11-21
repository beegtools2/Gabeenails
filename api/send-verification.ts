import type { ApiRequest, ApiResponse } from '../server/http';
import { methodNotAllowed } from '../server/http';
import { handleSendVerification } from '../server/emailHandlers';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    methodNotAllowed(res, 'POST');
    return;
  }
  await handleSendVerification(req, res);
}
