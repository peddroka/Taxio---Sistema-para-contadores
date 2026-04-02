import { buildGroqRequestBody, GROQ_API_URL, parseGroqResponse } from '../../src/services/groq-shared';
import type { RegimeTributario } from '../../src/services/groq-shared';

interface NetlifyEvent {
  httpMethod?: string;
  body?: string | null;
}

interface HandlerResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

interface ClassificarPayload {
  descricao?: string;
  uf?: string;
  erp?: string;
  regime?: RegimeTributario;
}

function json(statusCode: number, payload: Record<string, unknown>): HandlerResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(payload)
  };
}

function isRegimeTributario(value: unknown): value is RegimeTributario {
  return value === 'simples_nacional' || value === 'lucro_presumido' || value === 'lucro_real';
}

function getGroqApiKey() {
  return process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
}

export async function handler(event: NetlifyEvent): Promise<HandlerResponse> {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Metodo nao permitido' });
  }

  const apiKey = getGroqApiKey();

  if (!apiKey) {
    return json(500, {
      error: 'GROQ_API_KEY nao configurada na Netlify Function.'
    });
  }

  try {
    const payload = JSON.parse(event.body || '{}') as ClassificarPayload;
    const descricao = payload.descricao?.trim();
    const uf = payload.uf?.trim();
    const erp = payload.erp?.trim();
    const regime = payload.regime ?? 'lucro_presumido';

    if (!descricao || !uf || !erp) {
      return json(400, { error: 'Descricao, UF e ERP sao obrigatorios' });
    }

    if (!isRegimeTributario(regime)) {
      return json(400, { error: 'Regime tributario invalido' });
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

      return json(502, { error: errorMessage });
    }

    const groqResponse = await upstreamResponse.json();
    const result = parseGroqResponse(groqResponse);

    return json(200, result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro interno ao classificar com a Groq';

    return json(500, { error: message });
  }
}
