import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import dotenv from 'dotenv';
import { telegramSalesPlugin } from './telegramPlugin.ts';
import {
  handleLibroReclamaciones,
  handleSendPasswordReset,
  handleSendVerification,
} from './server/emailHandlers.ts';
import type { ApiRequest, ApiResponse } from './server/http.ts';
import { loadFirebaseConfig } from './config/firebase.ts';

// Cargar variables de entorno desde .env solo en desarrollo local.
// En Vercel las variables se inyectan como process.env.
dotenv.config({ override: true });

/**
 * En Vercel estos mismos endpoints viven en /api/*.ts.
 * Aquí se mantienen los middleware de Vite para que `npm run dev` y
 * `npm run preview` sigan funcionando exactamente igual.
 */
function emailApiPlugin(): Plugin {
  const handler = (req: ApiRequest, res: ApiResponse, next: () => void) => {
    const url = req.url ? req.url.split('?')[0] : '';

    if (url === '/api/send-verification' && req.method === 'POST') {
      void handleSendVerification(req, res);
      return;
    }

    if (url === '/api/send-password-reset' && req.method === 'POST') {
      void handleSendPasswordReset(req, res);
      return;
    }

    if (url === '/api/libro-reclamaciones/send' && req.method === 'POST') {
      void handleLibroReclamaciones(req, res);
      return;
    }

    next();
  };

  return {
    name: 'email-api',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig(({ mode }) => {
  return {
    define: {
      __FIREBASE_CONFIG__: JSON.stringify(loadFirebaseConfig(mode)),
    },
    plugins: [react(), tailwindcss(), emailApiPlugin(), telegramSalesPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
