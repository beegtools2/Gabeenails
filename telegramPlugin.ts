import type { Plugin } from 'vite';
import type { ApiRequest, ApiResponse } from './server/http';
import actions from './api/telegram/actions';
import appointment from './api/telegram/appointment';
import recharge from './api/telegram/recharge';
import status from './api/telegram/status';
import storeOrder from './api/telegram/store-order';

// Reuse the API handlers for local development and preview without starting
// Telegram polling or making network requests while loading the build config.
export function telegramSalesPlugin(): Plugin {
  const routes: Record<string, (req: ApiRequest, res: ApiResponse) => void | Promise<void>> = {
    '/api/telegram/actions': actions,
    '/api/telegram/appointment': appointment,
    '/api/telegram/recharge': recharge,
    '/api/telegram/status': status,
    '/api/telegram/store-order': storeOrder,
  };

  const middleware = (req: ApiRequest, res: ApiResponse, next: (error?: unknown) => void) => {
    const handler = routes[req.url?.split('?')[0] || ''];
    if (!handler) {
      next();
      return;
    }

    void Promise.resolve().then(() => handler(req, res)).catch(next);
  };

  return {
    name: 'telegram-sales',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
