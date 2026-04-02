import { emitTaxioDataUpdated } from './events';

export interface ConfigWebhook {
  url: string;
  ativo: boolean;
  eventos: Array<'lote_concluido' | 'classificacao_salva' | 'erro_lote'>;
  segredo: string;
}

export interface HistoricoWebhook {
  id: string;
  status: 'sucesso' | 'erro';
  evento: string;
  data: string;
  mensagem: string;
}

const WEBHOOK_KEY = 'taxio_webhook';
const WEBHOOK_HISTORY_KEY = 'taxio_webhook_history';

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `hook-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function registrarHistorico(
  status: HistoricoWebhook['status'],
  evento: string,
  mensagem: string
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const historico = listarHistoricoWebhooks();

  historico.unshift({
    id: generateId(),
    status,
    evento,
    data: new Date().toISOString(),
    mensagem
  });

  localStorage.setItem(WEBHOOK_HISTORY_KEY, JSON.stringify(historico.slice(0, 10)));
  emitTaxioDataUpdated('webhook');
}

export function getWebhookConfig(): ConfigWebhook | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return JSON.parse(localStorage.getItem(WEBHOOK_KEY) || 'null') as ConfigWebhook | null;
  } catch {
    return null;
  }
}

export function salvarWebhookConfig(config: ConfigWebhook): void {
  localStorage.setItem(WEBHOOK_KEY, JSON.stringify(config));
  emitTaxioDataUpdated('webhook');
}

export function listarHistoricoWebhooks(): HistoricoWebhook[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    return JSON.parse(localStorage.getItem(WEBHOOK_HISTORY_KEY) || '[]') as HistoricoWebhook[];
  } catch {
    return [];
  }
}

export async function dispararWebhook(
  evento: ConfigWebhook['eventos'][number],
  payload: Record<string, unknown>
): Promise<boolean> {
  const config = getWebhookConfig();

  if (!config || !config.ativo) {
    return false;
  }

  if (!config.eventos.includes(evento)) {
    return false;
  }

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Taxio-Event': evento,
        'X-Taxio-Secret': config.segredo
      },
      body: JSON.stringify({
        evento,
        timestamp: new Date().toISOString(),
        dados: payload
      })
    });

    registrarHistorico(
      response.ok ? 'sucesso' : 'erro',
      evento,
      response.ok ? 'Webhook enviado com sucesso' : `Falha HTTP ${response.status}`
    );

    return response.ok;
  } catch {
    registrarHistorico('erro', evento, 'Erro de rede ao enviar webhook');
    return false;
  }
}

export async function testarWebhook(): Promise<boolean> {
  const config = getWebhookConfig();

  if (!config?.url) {
    return false;
  }

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Taxio-Event': 'teste',
        'X-Taxio-Secret': config.segredo
      },
      body: JSON.stringify({
        evento: 'teste',
        timestamp: new Date().toISOString(),
        dados: {
          mensagem: 'Teste de conectividade do Taxio'
        }
      })
    });

    registrarHistorico(
      response.ok ? 'sucesso' : 'erro',
      'teste',
      response.ok ? 'Teste enviado com sucesso' : `Falha HTTP ${response.status}`
    );

    return response.ok;
  } catch {
    registrarHistorico('erro', 'teste', 'Erro de rede ao testar webhook');
    return false;
  }
}
