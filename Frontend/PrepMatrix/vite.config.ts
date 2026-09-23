import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

import { handleGeminiProxyRequest } from './server/geminiProxy.js';

function readRequestBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function localGeminiProxyPlugin(): Plugin {
  return {
    name: 'local-gemini-proxy',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/gemini', async (req, res, next) => {
        try {
          const body = await readRequestBody(req as IncomingMessage);
          const result = await handleGeminiProxyRequest({
            method: req.method,
            body,
          });

          res.statusCode = result.status;
          Object.entries(result.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
          });
          (res as ServerResponse).end(JSON.stringify(result.body));
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const projectRoot = __dirname;
  const env = loadEnv(mode, projectRoot, '');
  Object.assign(process.env, env);

  if (mode === 'development') {
    console.info('[vite] gemini_proxy_env', {
      envRoot: projectRoot,
      geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      localGeminiProxyPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
  };
});
