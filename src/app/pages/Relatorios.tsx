import { useEffect, useMemo, useState } from 'react';
import { Download, FileBarChart, FileText, Lightbulb, Printer } from 'lucide-react';
import { motion } from 'motion/react';
import { TaxioButton } from '../components/taxio/TaxioButton';
import { TaxioCard } from '../components/taxio/TaxioCard';
import { TaxioSelect } from '../components/taxio/TaxioSelect';
import { listarEmpresas } from '../../services/empresas';
import { TAXIO_DATA_EVENT } from '../../services/events';
import {
  DadosRelatorio,
  baixarRelatorioHTML,
  imprimirRelatorio,
  listarRelatoriosGerados
} from '../../services/relatorio';
import { ClassificacaoSalva, listarClassificacoes } from '../../services/storage';

function gerarOpcoesMeses() {
  const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
  const options: Array<{ value: string; label: string }> = [];
  const start = new Date(2025, 0, 1);
  const current = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  for (
    let date = new Date(current.getFullYear(), current.getMonth(), 1);
    date >= start;
    date = new Date(date.getFullYear(), date.getMonth() - 1, 1)
  ) {
    const safeDate = new Date(date.getFullYear(), date.getMonth(), 1);

    options.push({
      value: safeDate.toISOString().slice(0, 7),
      label: formatter.format(safeDate)
    });
  }

  return options;
}

const statusOptions = [
  { value: 'todos', label: 'Todos' },
  { value: 'aprovado', label: 'Apenas aprovados' },
  { value: 'revisar', label: 'Apenas revisao' }
];

function formatPercent(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value);
}

function getPeriodoDeItem(item: ClassificacaoSalva) {
  if (item.criadoEm) {
    return item.criadoEm.slice(0, 7);
  }

  const [dia, mes, ano] = item.data.split('/');

  if (!dia || !mes || !ano) {
    return '';
  }

  return `${ano}-${mes.padStart(2, '0')}`;
}

function buildDadosRelatorio(
  classificacoes: ClassificacaoSalva[],
  mes: string,
  empresaId: string,
  status: string,
  empresas: ReturnType<typeof listarEmpresas>,
  mesesDisponiveis: Array<{ value: string; label: string }>
): DadosRelatorio {
  const empresaSelecionada = empresas.find((empresa) => empresa.id === empresaId) || null;
  const classificacoesFiltradas = classificacoes.filter((item) => {
    const matchesMes = getPeriodoDeItem(item) === mes;
    const matchesEmpresa = !empresaId || item.empresaId === empresaId;
    const matchesStatus = status === 'todos' ? true : item.status === status;

    return matchesMes && matchesEmpresa && matchesStatus;
  });

  const totalClassificados = classificacoesFiltradas.length;
  const totalAprovados = classificacoesFiltradas.filter((item) => item.status === 'aprovado').length;
  const totalRevisar = classificacoesFiltradas.filter((item) => item.status === 'revisar').length;

  return {
    empresa: empresaSelecionada,
    mes: mesesDisponiveis.find((item) => item.value === mes)?.label || mes,
    periodo: mes,
    totalClassificados,
    totalAprovados,
    totalRevisar,
    acuraciaMedia: totalClassificados
      ? Number(
          (
            classificacoesFiltradas.reduce((acc, item) => acc + item.confianca, 0) /
            totalClassificados
          ).toFixed(1)
        )
      : 0,
    porOrigem: {
      ia: classificacoesFiltradas.filter((item) => item.origem === 'ia').length,
      lote: classificacoesFiltradas.filter((item) => item.origem === 'lote').length,
      manual: classificacoesFiltradas.filter((item) => item.origem === 'manual').length
    },
    classificacoes: classificacoesFiltradas
  };
}

export default function Relatorios() {
  const mesesDisponiveis = useMemo(() => gerarOpcoesMeses(), []);
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7));
  const [empresaId, setEmpresaId] = useState('');
  const [status, setStatus] = useState('todos');
  const [empresas, setEmpresas] = useState(() => listarEmpresas());
  const [historico, setHistorico] = useState(() => listarRelatoriosGerados());
  const [classificacoes, setClassificacoes] = useState(() => listarClassificacoes());
  const [relatorioGerado, setRelatorioGerado] = useState<DadosRelatorio | null>(null);
  const [loadingAction, setLoadingAction] = useState<'html' | 'pdf' | null>(null);

  useEffect(() => {
    const syncData = () => {
      setEmpresas(listarEmpresas());
      setHistorico(listarRelatoriosGerados());
      setClassificacoes(listarClassificacoes());
    };

    window.addEventListener(TAXIO_DATA_EVENT, syncData as EventListener);

    return () => window.removeEventListener(TAXIO_DATA_EVENT, syncData as EventListener);
  }, []);

  const previewSource = useMemo(
    () => buildDadosRelatorio(classificacoes, mes, empresaId, status, empresas, mesesDisponiveis),
    [classificacoes, empresaId, empresas, mes, mesesDisponiveis, status]
  );
  const dadosRelatorio = relatorioGerado;
  const totalPreview = dadosRelatorio?.totalClassificados || 0;
  const aprovacaoPercentual = totalPreview
    ? (dadosRelatorio!.totalAprovados / totalPreview) * 100
    : 0;
  const horasEconomizadas = totalPreview ? (totalPreview * 10) / 60 : 0;
  const previewItems = dadosRelatorio?.classificacoes.slice(0, 10) || [];
  const origemTotal =
    (dadosRelatorio?.porOrigem.ia || 0) +
    (dadosRelatorio?.porOrigem.lote || 0) +
    (dadosRelatorio?.porOrigem.manual || 0);

  function handleGerar() {
    setRelatorioGerado(previewSource);
  }

  function exportar(formato: 'html' | 'pdf') {
    if (!dadosRelatorio) {
      return;
    }

    setLoadingAction(formato);

    window.setTimeout(() => {
      if (formato === 'html') {
        baixarRelatorioHTML(dadosRelatorio);
      } else {
        imprimirRelatorio(dadosRelatorio);
      }

      setHistorico(listarRelatoriosGerados());
      setLoadingAction(null);
    }, 120);
  }

  function baixarHistorico(periodo?: string, companyId?: string) {
    if (!periodo) {
      return;
    }

    const dados = buildDadosRelatorio(classificacoes, periodo, companyId || '', 'todos', empresas, mesesDisponiveis);

    baixarRelatorioHTML(dados);
    setHistorico(listarRelatoriosGerados());
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <FileBarChart className="w-5 h-5" style={{ color: 'var(--accent-light)' }} />
          <h1 className="font-bold" style={{ color: 'var(--text-primary)' }}>
            Relatorios Mensais
          </h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Gere e exporte relatorios de classificacoes por periodo
        </p>
      </div>

      <TaxioCard className="rounded-[14px]">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <TaxioSelect
            label="Mes / ano"
            options={mesesDisponiveis}
            value={mes}
            onChange={(event) => setMes(event.target.value)}
            className="flex-1"
          />
          <TaxioSelect
            label="Empresa"
            options={[
              { value: '', label: 'Todas as empresas' },
              ...empresas.map((empresa) => ({
                value: empresa.id,
                label: empresa.razaoSocial
              }))
            ]}
            value={empresaId}
            onChange={(event) => setEmpresaId(event.target.value)}
            className="flex-1"
          />
          <TaxioSelect
            label="Status"
            options={statusOptions}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="flex-1"
          />
          <TaxioButton className="justify-center" onClick={handleGerar}>
            Gerar
          </TaxioButton>
        </div>
      </TaxioCard>

      {!dadosRelatorio && (
        <TaxioCard className="mt-6 rounded-[14px]">
          <div className="py-12 text-center max-w-2xl mx-auto">
            <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Selecione um periodo para gerar o relatorio
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Escolha mes, empresa e status. Ao clicar em Gerar, o Taxio monta a previa, calcula os indicadores e libera as opcoes de exportacao.
            </p>
          </div>
        </TaxioCard>
      )}

      {dadosRelatorio && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
            {[
              ['Total classificados no periodo', totalPreview.toLocaleString('pt-BR')],
              ['Taxa de aprovacao', `${formatPercent(aprovacaoPercentual)}%`],
              ['Acuracia media da IA', `${formatPercent(dadosRelatorio.acuraciaMedia)}%`],
              ['Horas economizadas estimadas', `~${formatPercent(horasEconomizadas)}h`]
            ].map(([label, value], index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: index * 0.06 }}
              >
                <div
                  className="rounded-[14px] border p-5"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                >
                  <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {label}
                  </div>
                  <div className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    {value}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {!dadosRelatorio.classificacoes.length && (
            <TaxioCard className="mt-6 rounded-[14px]">
              <div className="py-12 text-center">
                <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Nenhum dado para este periodo
                </h3>
                <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                  Ajuste os filtros e gere novamente para montar um relatorio com classificacoes aprovadas ou em revisao.
                </p>
              </div>
            </TaxioCard>
          )}

          {!!dadosRelatorio.classificacoes.length && (
            <div className="grid grid-cols-1 xl:grid-cols-[1.55fr_1fr] gap-6 mt-6">
              <TaxioCard className="rounded-[14px]">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      Previa das classificacoes
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Primeiras 10 linhas do relatorio de {dadosRelatorio.mes}
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[14px] border" style={{ borderColor: 'var(--border)' }}>
                  <table className="w-full">
                    <thead style={{ backgroundColor: 'var(--bg-elevated)' }}>
                      <tr>
                        {['Produto', 'NCM', 'CST', 'Origem', 'Status'].map((header) => (
                          <th
                            key={header}
                            className="text-left px-4 py-3 text-xs uppercase tracking-wide"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewItems.map((item) => (
                        <tr
                          key={item.id}
                          className="transition-colors"
                          style={{ borderTop: '1px solid var(--border)' }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                            {item.produto}
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {item.ncm}
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {item.cst}
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {item.origem.toUpperCase()}
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {item.status === 'aprovado' ? 'Aprovado' : 'Revisar'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
                  {dadosRelatorio.totalClassificados > previewItems.length
                    ? `... e mais ${dadosRelatorio.totalClassificados - previewItems.length} classificacoes no relatorio completo`
                    : 'Todas as classificacoes do periodo estao visiveis nesta previa.'}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mt-5">
                  <TaxioButton
                    icon={<Download className="w-4 h-4" />}
                    onClick={() => exportar('html')}
                    loading={loadingAction === 'html'}
                  >
                    Baixar HTML
                  </TaxioButton>
                  <TaxioButton
                    variant="outline"
                    icon={<Printer className="w-4 h-4" />}
                    onClick={() => exportar('pdf')}
                    loading={loadingAction === 'pdf'}
                  >
                    Imprimir / Salvar PDF
                  </TaxioButton>
                </div>
              </TaxioCard>

              <div className="space-y-6">
                <TaxioCard className="rounded-[14px]">
                  <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Distribuicao por origem
                  </h3>
                  {[
                    ['IA', dadosRelatorio.porOrigem.ia, '#1A4ED8'],
                    ['Lote', dadosRelatorio.porOrigem.lote, '#10B981'],
                    ['Manual', dadosRelatorio.porOrigem.manual, '#F59E0B']
                  ].map(([label, value, color]) => {
                    const percentual = origemTotal ? (Number(value) / origemTotal) * 100 : 0;

                    return (
                      <div key={label} className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span style={{ color: 'var(--text-primary)' }}>{label}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{formatPercent(percentual)}%</span>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${percentual}%`, backgroundColor: String(color) }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex flex-wrap gap-3 mt-4">
                    {[
                      ['IA', '#1A4ED8'],
                      ['Lote', '#10B981'],
                      ['Manual', '#F59E0B']
                    ].map(([label, color]) => (
                      <div key={label} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: String(color) }} />
                        {label}
                      </div>
                    ))}
                  </div>
                </TaxioCard>

                <TaxioCard className="rounded-[14px]">
                  <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Ultimos relatorios gerados
                  </h3>
                  <div className="space-y-3">
                    {historico.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-[14px] border p-4"
                        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-elevated)' }}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: 'rgba(26, 78, 216, 0.12)' }}
                          >
                            <FileText className="w-4 h-4" style={{ color: 'var(--accent-light)' }} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                              {item.mes}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {item.totalClassificados} produtos - {new Date(item.criadoEm).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <button
                          className="p-2 rounded-lg"
                          style={{ color: 'var(--accent-light)', backgroundColor: 'transparent' }}
                          onClick={() => baixarHistorico(item.periodo, item.empresaId)}
                          title="Baixar novamente em HTML"
                          disabled={!item.periodo}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {!historico.length && (
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Nenhum relatorio gerado ainda.
                      </p>
                    )}
                  </div>
                </TaxioCard>

                <TaxioCard className="rounded-[14px]">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(245, 158, 11, 0.16)' }}
                    >
                      <Lightbulb className="w-5 h-5" style={{ color: 'var(--warning)' }} />
                    </div>
                    <div>
                      <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Dica profissional
                      </h3>
                      <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                        Envie o relatorio mensal para cada cliente como comprovante do trabalho de classificacao realizado. Isso aumenta a percepcao de valor do seu servico.
                      </p>
                    </div>
                  </div>
                </TaxioCard>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
