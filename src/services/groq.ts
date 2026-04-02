import { incrementarUso } from './plano';
import { normalizeResult } from './groq-shared';
import type { ClassificacaoResult, RegimeTributario } from './groq-shared';

export type { ClassificacaoResult, RegimeTributario } from './groq-shared';

const GROQ_PROXY_URL = '/api/groq/classificar';

interface ErrorResponse {
  error?: string;
}

export async function classificarProduto(
  descricao: string,
  uf: string,
  erp: string,
  regime: RegimeTributario = 'lucro_presumido',
  signal?: AbortSignal
): Promise<ClassificacaoResult> {
  const response = await fetch(GROQ_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      descricao,
      uf,
      erp,
      regime
    }),
    signal
  });

  if (!response.ok) {
    let message = `Erro ao classificar (${response.status})`;

    try {
      const error = (await response.json()) as ErrorResponse;

      if (typeof error.error === 'string' && error.error.trim()) {
        message = error.error;
      }
    } catch {
      // Mantem a mensagem padrao quando o backend nao retorna JSON.
    }

    throw new Error(message);
  }

  const normalized = normalizeResult(await response.json());

  incrementarUso();

  return normalized;
}
