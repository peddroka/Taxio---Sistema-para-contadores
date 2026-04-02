import { useEffect, useState } from 'react';
import { Code2, Plug } from 'lucide-react';
import { TaxioButton } from '../components/taxio/TaxioButton';
import { TaxioCard } from '../components/taxio/TaxioCard';
import { TaxioInput } from '../components/taxio/TaxioInput';
import { TAXIO_DATA_EVENT } from '../../services/events';
import {
  ConfigWebhook,
  getWebhookConfig,
  listarHistoricoWebhooks,
  salvarWebhookConfig,
  testarWebhook
} from '../../services/webhook';

const defaultWebhookConfig: ConfigWebhook = {
  url: '',
  ativo: false,
  eventos: ['lote_concluido'],
  segredo: ''
};

export default function Integracoes() {
  const [config, setConfig] = useState<ConfigWebhook>(() => getWebhookConfig() || defaultWebhookConfig);
  const [historico, setHistorico] = useState(() => listarHistoricoWebhooks());

  useEffect(() => {
    const syncData = () => {
      setConfig(getWebhookConfig() || defaultWebhookConfig);
      setHistorico(listarHistoricoWebhooks());
    };

    window.addEventListener(TAXIO_DATA_EVENT, syncData as EventListener);

    return () => window.removeEventListener(TAXIO_DATA_EVENT, syncData as EventListener);
  }, []);

  function toggleEvento(evento: ConfigWebhook['eventos'][number]) {
    setConfig((current) => ({
      ...current,
      eventos: current.eventos.includes(evento)
        ? current.eventos.filter((item) => item !== evento)
        : [...current.eventos, evento]
    }));
  }

  function abrirWhatsAppInteresseAPI() {
    const mensagem = encodeURIComponent(
      'Ola! Tenho interesse na API do Taxio. Quero ser avisado quando estiver disponivel.'
    );

    window.open(`https://wa.me/5511999999999?text=${mensagem}`, '_blank');
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Plug className="w-5 h-5" style={{ color: 'var(--accent-light)' }} />
          <h1 className="font-bold" style={{ color: 'var(--text-primary)' }}>
            Integracoes
          </h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Configure webhooks e acompanhe os disparos recentes do Taxio
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaxioCard title="Webhook">
          <div className="space-y-4">
            <label
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <input
                type="checkbox"
                checked={config.ativo}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    ativo: event.target.checked
                  }))
                }
              />
              <span style={{ color: 'var(--text-primary)' }}>Ativar webhook</span>
            </label>

            <TaxioInput
              label="URL do webhook"
              value={config.url}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  url: event.target.value
                }))
              }
              placeholder="https://seu-endpoint.com/webhook"
            />

            <TaxioInput
              label="Segredo / token"
              value={config.segredo}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  segredo: event.target.value
                }))
              }
              placeholder="token-seguro"
            />

            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Eventos
              </p>
              <div className="space-y-2">
                {(['lote_concluido', 'classificacao_salva', 'erro_lote'] as const).map((evento) => (
                  <label key={evento} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.eventos.includes(evento)}
                      onChange={() => toggleEvento(evento)}
                    />
                    <span style={{ color: 'var(--text-secondary)' }}>{evento}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <TaxioButton
                variant="outline"
                className="flex-1"
                onClick={() => salvarWebhookConfig(config)}
              >
                Salvar configuracao
              </TaxioButton>
              <TaxioButton className="flex-1" onClick={() => testarWebhook()}>
                Testar webhook
              </TaxioButton>
            </div>
          </div>
        </TaxioCard>

        <TaxioCard>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(124, 58, 237, 0.14)' }}
              >
                <Code2 className="w-5 h-5" style={{ color: '#8B5CF6' }} />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  API do Taxio
                </h3>
                <div
                  className="inline-flex mt-2 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}
                >
                  Em breve
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm leading-6 mb-5" style={{ color: 'var(--text-secondary)' }}>
            Integre o ERP do seu cliente diretamente ao Taxio. Sem interface e sem copia e cola:
            o proprio sistema do cliente consulta e recebe a classificacao fiscal automaticamente via requisicao HTTP.
          </p>

          <div
            className="rounded-2xl border p-4 mb-5"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.82)', borderColor: 'rgba(139, 92, 246, 0.18)' }}
          >
            <p
              className="text-[11px] font-semibold tracking-[0.2em] mb-3"
              style={{ color: 'rgba(255, 255, 255, 0.56)' }}
            >
              EXEMPLO DE USO
            </p>
            <pre
              className="text-xs leading-6 whitespace-pre-wrap"
              style={{ color: '#E2E8F0', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
            >
{`POST https://api.taxio.com.br/v1/classificar

{
  "descricao": "Notebook Dell Inspiron 15",
  "uf": "SP",
  "regime": "lucro_presumido"
}

// Retorna:
{
  "ncm": "8471.30.12",
  "cest": "21.029.00",
  "cst": "000",
  "cClassTrib": "010",
  "confianca": 100
}`}
            </pre>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {['Integracao com TOTVS', 'Integracao com SAP', 'Qualquer ERP via HTTP'].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              >
                <Plug className="w-3.5 h-3.5" />
                {item}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm max-w-md" style={{ color: 'var(--text-secondary)' }}>
              A API estara disponivel em breve. Cadastre seu interesse e seja notificado quando lancar.
            </p>
            <TaxioButton variant="outline" onClick={abrirWhatsAppInteresseAPI}>
              Quero ser notificado via WhatsApp
            </TaxioButton>
          </div>
        </TaxioCard>
      </div>

      <TaxioCard title="Historico de disparos" className="mt-6">
        <div className="space-y-3">
          {historico.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {item.evento}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {item.mensagem}
                </p>
              </div>
              <div className="text-right">
                <div
                  className="text-xs font-semibold"
                  style={{ color: item.status === 'sucesso' ? 'var(--success)' : 'var(--danger)' }}
                >
                  {item.status === 'sucesso' ? 'Sucesso' : 'Erro'}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(item.data).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          ))}
          {!historico.length && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Nenhum disparo registrado ainda.
            </p>
          )}
        </div>
      </TaxioCard>
    </div>
  );
}
