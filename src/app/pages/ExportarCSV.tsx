import { Download, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TaxioButton } from '../components/taxio/TaxioButton';
import { TaxioCard } from '../components/taxio/TaxioCard';
import { TaxioSelect } from '../components/taxio/TaxioSelect';
import { ERPType, downloadCSV, gerarCSVPorERP } from '../../services/exportar';
import { ClassificacaoSalva, listarClassificacoes } from '../../services/storage';

const erpOptions = [
  { value: '', label: 'Selecione o ERP' },
  { value: 'totvs', label: 'TOTVS/Protheus' },
  { value: 'sap', label: 'SAP Business One' },
  { value: 'omie', label: 'Omie' },
  { value: 'bling', label: 'Bling' },
  { value: 'generico', label: 'CSV Generico' }
];

const periodoOptions = [
  { value: '', label: 'Selecione o periodo' },
  { value: 'hoje', label: 'Hoje' },
  { value: 'semana', label: 'Ultima semana' },
  { value: 'mes', label: 'Ultimo mes' },
  { value: 'trimestre', label: 'Ultimo trimestre' },
  { value: 'ano', label: 'Ultimo ano' },
  { value: 'todos', label: 'Todos os registros' }
];

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'aprovados', label: 'Apenas aprovados' },
  { value: 'revisar', label: 'Apenas para revisar' },
  { value: 'todos', label: 'Todos' }
];

function matchesPeriodo(item: ClassificacaoSalva, periodo: string) {
  if (!periodo || periodo === 'todos') {
    return true;
  }

  const baseDate = new Date(item.criadoEm || item.data);
  const now = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (periodo === 'hoje') {
    return baseDate.toDateString() === now.toDateString();
  }

  if (periodo === 'semana') {
    return now.getTime() - baseDate.getTime() <= 7 * oneDayMs;
  }

  if (periodo === 'mes') {
    return now.getTime() - baseDate.getTime() <= 30 * oneDayMs;
  }

  if (periodo === 'trimestre') {
    return now.getTime() - baseDate.getTime() <= 90 * oneDayMs;
  }

  if (periodo === 'ano') {
    return now.getTime() - baseDate.getTime() <= 365 * oneDayMs;
  }

  return true;
}

function matchesStatus(item: ClassificacaoSalva, status: string, incluirRevisar: boolean) {
  if (!status || status === 'todos') {
    return true;
  }

  if (status === 'revisar') {
    return item.status === 'revisar';
  }

  if (status === 'aprovados') {
    return incluirRevisar ? item.status === 'aprovado' || item.status === 'revisar' : item.status === 'aprovado';
  }

  return true;
}

export default function ExportarCSV() {
  const [erp, setErp] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [status, setStatus] = useState('');
  const [incluirRevisar, setIncluirRevisar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classificacoes, setClassificacoes] = useState<ClassificacaoSalva[]>([]);

  useEffect(() => {
    setClassificacoes(listarClassificacoes());
  }, []);

  const itensFiltrados = classificacoes.filter(
    (item) => matchesPeriodo(item, periodo) && matchesStatus(item, status, incluirRevisar)
  );

  async function handleExport() {
    if (!erp) {
      setError('Selecione o ERP de destino para gerar o arquivo.');
      return;
    }

    if (!itensFiltrados.length) {
      setError('Nenhuma classificacao encontrada com os filtros selecionados.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const csv = gerarCSVPorERP(
        itensFiltrados.map((item) => ({
          codigo: item.codigo || '',
          descricao: item.produto,
          ncm: item.ncm,
          cest: item.cest,
          cst: item.cst,
          cClassTrib: item.cClassTrib
        })),
        erp as ERPType
      );
      const data = new Date().toISOString().slice(0, 10);

      downloadCSV(csv, `taxio_export_${erp}_${data}.csv`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Exportar CSV para ERP
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Gere arquivos CSV formatados para importacao no seu ERP
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaxioCard title="Configurar exportacao">
          <div className="space-y-4">
            <TaxioSelect
              label="ERP de destino"
              options={erpOptions}
              value={erp}
              onChange={(event) => setErp(event.target.value)}
            />

            <TaxioSelect
              label="Periodo"
              options={periodoOptions}
              value={periodo}
              onChange={(event) => setPeriodo(event.target.value)}
            />

            <TaxioSelect
              label="Filtro por status"
              options={statusOptions}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            />

            <label
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <input
                type="checkbox"
                checked={incluirRevisar}
                onChange={(event) => setIncluirRevisar(event.target.checked)}
                className="w-5 h-5 rounded"
                style={{
                  accentColor: 'var(--accent-royal)'
                }}
              />
              <div>
                <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Incluir produtos para revisao
                </div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Quando o filtro estiver em aprovados, inclui tambem os itens pendentes de revisao.
                </div>
              </div>
            </label>

            <TaxioButton
              icon={loading ? undefined : <Download className="w-4 h-4" />}
              onClick={handleExport}
              loading={loading}
              disabled={!erp || !periodo || !status}
              className="w-full"
            >
              {loading ? 'Gerando arquivo...' : 'Gerar e baixar CSV'}
            </TaxioButton>
          </div>

          <div
            className="mt-6 p-4 rounded-lg border-l-4"
            style={{
              backgroundColor: 'rgba(59, 110, 240, 0.1)',
              borderColor: 'var(--info)'
            }}
          >
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: 'var(--info)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--info)' }}>
                  Formato personalizado
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  O arquivo e gerado com as colunas e a formatacao especifica do ERP selecionado.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div
              className="mt-4 rounded-xl border px-4 py-3 text-sm"
              style={{
                borderColor: 'rgba(239, 68, 68, 0.4)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                color: 'var(--danger)'
              }}
            >
              {error}
            </div>
          )}
        </TaxioCard>

        <TaxioCard title="Registros encontrados" delay={0.1}>
          <div className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {itensFiltrados.length} registro(s) pronto(s) para exportacao com os filtros atuais.
          </div>

          <div className="space-y-3">
            {itensFiltrados.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-opacity-50"
                style={{ backgroundColor: 'var(--bg-elevated)' }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
                >
                  <FileText className="w-5 h-5" style={{ color: 'var(--success)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    {item.produto}
                  </p>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                    NCM: {item.ncm} • CEST: {item.cest || '-'}
                  </p>
                  <span
                    className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      color: item.status === 'aprovado' ? 'var(--success)' : 'var(--warning)'
                    }}
                  >
                    {item.status === 'aprovado' ? 'Aprovado' : 'Revisar'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {!itensFiltrados.length && (
            <div
              className="mt-4 rounded-xl border px-4 py-6 text-sm text-center"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-secondary)'
              }}
            >
              Nenhum registro encontrado com os filtros atuais.
            </div>
          )}

          {itensFiltrados.length > 6 && (
            <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Mostrando 6 de {itensFiltrados.length} registros.
            </p>
          )}
        </TaxioCard>
      </div>
    </div>
  );
}
