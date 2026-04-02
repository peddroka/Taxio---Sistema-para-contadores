import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { buildGroqRequestBody, GROQ_API_URL, parseGroqResponse } from './src/services/groq-shared';
import type { RegimeTributario } from './src/services/groq-shared';

interface ClassificarPayload {
  descricao?: string;
  uf?: string;
  erp?: string;
  regime?: RegimeTributario;
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let rawBody = '';

    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      rawBody += chunk;

      if (rawBody.length > 100_000) {
        reject(new Error('Payload excede o limite permitido'));
      }
    });
    req.on('end', () => {
      if (!rawBody.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch {
        reject(new Error('JSON invalido'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, payload: Record<string, unknown>) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function isRegimeTributario(value: unknown): value is RegimeTributario {
  return value === 'simples_nacional' || value === 'lucro_presumido' || value === 'lucro_real';
}

function getServerGroqApiKey(env: Record<string, string>) {
  return (
    env.GROQ_API_KEY ||
    process.env.GROQ_API_KEY ||
    env.VITE_GROQ_API_KEY ||
    process.env.VITE_GROQ_API_KEY
  );
}

function createGroqMiddleware(resolveApiKey: () => string | undefined) {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: (error?: unknown) => void
  ) => {
    const pathname = req.url ? new URL(req.url, 'http://localhost').pathname : '';

    if (pathname !== '/api/groq/classificar') {
      next();
      return;
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Metodo nao permitido' });
      return;
    }

    const apiKey = resolveApiKey();

    if (!apiKey) {
      sendJson(res, 500, {
        error:
          'GROQ_API_KEY nao configurada no servidor. Defina GROQ_API_KEY em .env.local ou no ambiente do processo.'
      });
      return;
    }

    try {
      const payload = (await readJsonBody(req)) as ClassificarPayload;
      const descricao = payload.descricao?.trim();
      const uf = payload.uf?.trim();
      const erp = payload.erp?.trim();
      const regime = payload.regime ?? 'lucro_presumido';

      if (!descricao || !uf || !erp) {
        sendJson(res, 400, { error: 'Descricao, UF e ERP sao obrigatorios' });
        return;
      }

      if (!isRegimeTributario(regime)) {
        sendJson(res, 400, { error: 'Regime tributario invalido' });
        return;
      }

      const upstreamResponse = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(buildGroqRequestBody(descricao, uf, erp, regime))
      });

      if (!upstreamResponse.ok) {
        let errorMessage = `Groq API error: ${upstreamResponse.status}`;

        try {
          const errorPayload = (await upstreamResponse.json()) as {
            error?: { message?: string };
          };
          const upstreamMessage = errorPayload.error?.message?.trim();

          if (upstreamMessage) {
            errorMessage = upstreamMessage;
          }
        } catch {
          // Mantem a mensagem padrao quando a Groq nao retorna JSON.
        }

        sendJson(res, 502, { error: errorMessage });
        return;
      }

      const groqResponse = await upstreamResponse.json();
      const result = parseGroqResponse(groqResponse);

      sendJson(res, 200, result);
    } catch (error) {
      next(error);
    }
  };
}

export default defineConfig(({ mode }) => {
  const groqMiddleware = createGroqMiddleware(() =>
    getServerGroqApiKey(loadEnv(mode, process.cwd(), ''))
  );

  return {
    plugins: [
      {
        name: 'taxio-groq-dev-proxy',
        configureServer(server) {
          server.middlewares.use(groqMiddleware);
        },
        configurePreviewServer(server) {
          server.middlewares.use(groqMiddleware);
        }
      },
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used - do not remove them
      react(),
      tailwindcss()
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src')
      }
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv']
  };
});
