import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { MetricCard } from '../components/taxio/MetricCard';
import { TaxioBadge } from '../components/taxio/TaxioBadge';
import { TaxioButton } from '../components/taxio/TaxioButton';
import { TaxioCard } from '../components/taxio/TaxioCard';
import { TaxioProgressBar } from '../components/taxio/TaxioProgressBar';
import { getEmpresaAtiva } from '../../services/empresas';
import { TAXIO_DATA_EVENT } from '../../services/events';
import { getPlanoAtual, getUsoMensal, verificarLimite } from '../../services/plano';
import { ClassificacaoSalva, listarClassificacoes } from '../../services/storage';

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value)}%`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ClassificacaoSalva[]>([]);
  const [empresaAtiva, setEmpresaAtiva] = useState(() => getEmpresaAtiva());
  const [planoAtual, setPlanoAtual] = useState(() => getPlanoAtual());
  const [usoMensal, setUsoMensal] = useState(() => getUsoMensal());
  const [limiteInfo, setLimiteInfo] = useState(() => verificarLimite());

  useEffect(() => {
    const syncData = () => {
      setEmpresaAtiva(getEmpresaAtiva());
      setItems(listarClassificacoes());
      setPlanoAtual(getPlanoAtual());
      setUsoMensal(getUsoMensal());
      setLimiteInfo(verificarLimite());
    };

    syncData();
    window.addEventListener(TAXIO_DATA_EVENT, syncData as EventListener);

    return () => window.removeEventListener(TAXIO_DATA_EVENT, syncData as EventListener);
  }, []);

  const filteredItems = empresaAtiva ? items.filter((item) => item.empresaId === empresaAtiva.id) : items;
  const total = filteredItems.length;
  const aprovados = filteredItems.filter((item) => item.status === 'aprovado').length;
  const revisar = filteredItems.filter((item) => item.status === 'revisar').length;
  const origemIA = filteredItems.filter((item) => item.origem === 'ia').length;
  const origemLote = filteredItems.filter((item) => item.origem === 'lote').length;
  const origemManual = filteredItems.filter((item) => item.origem === 'manual').length;
  const acuraciaMedia = total
    ? filteredItems.reduce((accumulator, item) => accumulator + item.confianca, 0) / total
    : 0;
  const riscosAltos = filteredItems.filter((item) => item.nivelRisco === 'alto').length;
  const recentClassifications = filteredItems.slice(0, 5);
  const activities = [
    { label: 'Consultas com IA', value: origemIA, max: Math.max(total, 1) },
    { label: 'Consultas em lote', value: origemLote, max: Math.max(total, 1) },
    { label: 'Consultas manuais', value: origemManual, max: Math.max(total, 1) },
    { label: 'Risco alto', value: riscosAltos, max: Math.max(total, 1) }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Dashboard
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {empresaAtiva ? `Empresa ativa: ${empresaAtiva.razaoSocial}` : 'Bem-vindo de volta, Maria'}
          </p>
        </div>
        <TaxioButton icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/consulta-ia')}>
          Nova consulta
        </TaxioButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <MetricCard
          label="Produtos classificados"
          value={total.toLocaleString('pt-BR')}
          delta={{ value: `${aprovados} aprovados`, positive: aprovados >= revisar }}
          delay={0}
        />
        <MetricCard
          label="Acuracia media"
          value={formatPercent(acuraciaMedia)}
          delta={{ value: `${revisar} para revisar`, positive: revisar === 0 }}
          delay={0.06}
        />
        <MetricCard
          label="Aprovados"
          value={aprovados.toLocaleString('pt-BR')}
          delta={{ value: `${total ? Math.round((aprovados / total) * 100) : 0}% do total`, positive: true }}
          delay={0.12}
        />
        <MetricCard
          label="Origem IA"
          value={origemIA.toLocaleString('pt-BR')}
          delta={{ value: `${total ? Math.round((origemIA / total) * 100) : 0}% do total`, positive: true }}
          delay={0.18}
        />
        <MetricCard
          label="Origem Lote"
          value={origemLote.toLocaleString('pt-BR')}
          delta={{ value: `${total ? Math.round((origemLote / total) * 100) : 0}% do total`, positive: true }}
          delay={0.24}
        />
        <MetricCard
          label="Plano atual"
          value={planoAtual.nome}
          delta={{
            value:
              limiteInfo.limite === -1
                ? `${usoMensal.count} consultas neste mes`
                : `${usoMensal.count} / ${limiteInfo.limite} consultas`,
            positive: limiteInfo.limite === -1 || limiteInfo.percentual < 80
          }}
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaxioCard title="Ultimas classificacoes" delay={0.24}>
          {recentClassifications.length ? (
            <div className="space-y-3">
              {recentClassifications.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-opacity-50"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {item.produto}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      NCM: {item.ncm}
                    </p>
                  </div>
                  <TaxioBadge variant={item.status === 'aprovado' ? 'success' : 'warning'}>
                    {item.status === 'aprovado' ? 'Aprovado' : 'Revisar'}
                  </TaxioBadge>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="rounded-xl border px-4 py-8 text-sm text-center"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-secondary)'
              }}
            >
              Nenhuma classificacao salva ainda.
            </div>
          )}
        </TaxioCard>

        <TaxioCard title="Uso do plano e atividade" delay={0.3}>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Plano {planoAtual.nome}
              </span>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {limiteInfo.limite === -1 ? 'Ilimitado' : `${usoMensal.count} / ${limiteInfo.limite}`}
              </span>
            </div>
            <TaxioProgressBar
              value={limiteInfo.limite === -1 ? 0 : usoMensal.count}
              max={limiteInfo.limite === -1 ? 100 : limiteInfo.limite}
              showPercentage={limiteInfo.limite !== -1}
              color={planoAtual.cor}
            />
          </div>
          <div className="space-y-5">
            {activities.map((activity) => (
              <TaxioProgressBar
                key={activity.label}
                label={activity.label}
                value={activity.value}
                max={activity.max}
                showPercentage={true}
              />
            ))}
          </div>
        </TaxioCard>
      </div>
    </div>
  );
}
