import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Download, FileText, Upload, X } from 'lucide-react';
import { TaxioBadge } from '../components/taxio/TaxioBadge';
import { TaxioButton } from '../components/taxio/TaxioButton';
import { TaxioCard } from '../components/taxio/TaxioCard';
import { TaxioSelect } from '../components/taxio/TaxioSelect';
import { erpOptions, regimeOptions, ufOptions } from '../../services/catalogos';
import { TAXIO_DATA_EVENT } from '../../services/events';
import { downloadCSV } from '../../services/exportar';
import { getEmpresaAtiva } from '../../services/empresas';
import { RegimeTributario } from '../../services/groq';
import { ResultadoLote, parsearCSV, processarLote } from '../../services/lote';
import { getPlanoAtual, verificarLimite, verificarLimiteParaQuantidade } from '../../services/plano';
import { calcularRisco } from '../../services/risco';
import { salvarClassificacao } from '../../services/storage';
import { dispararWebhook } from '../../services/webhook';

function escapeCsvValue(value: string) {
  const safeValue = value.replace(/\r?\n/g, ' ').trim();

  if (safeValue.includes('"')) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }

  if (safeValue.includes(',')) {
    return `"${safeValue}"`;
  }

  return safeValue;
}

function gerarCSVResultado(resultados: ResultadoLote[]) {
  const header = [
    'codigo_produto',
    'descricao',
    'unidade',
    'status',
    'ncm',
    'cest',
    'cst',
    'cClassTrib',
    'confianca',
    'erro'
  ].join(',');
  const linhas = resultados.map((item) =>
    [
      escapeCsvValue(item.codigo_produto || ''),
      escapeCsvValue(item.descricao || ''),
      escapeCsvValue(item.unidade || ''),
      item.status,
      item.resultado?.ncm || '',
      item.resultado?.cest || '',
      item.resultado?.cst || '',
      item.resultado?.cClassTrib || '',
      item.resultado?.confianca?.toString() || '',
      escapeCsvValue(item.erro || '')
    ].join(',')
  );

  return [header, ...linhas].join('\n');
}

export default function ConsultaLote() {
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [erp, setErp] = useState('');
  const [uf, setUf] = useState('');
  const [regime, setRegime] = useState<RegimeTributario>('lucro_presumido');
  const [error, setError] = useState<string | null>(null);
  const [statusMensagem, setStatusMensagem] = useState<string | null>(null);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [resultados, setResultados] = useState<ResultadoLote[]>([]);
  const [empresaAtiva, setEmpresaAtiva] = useState(() => getEmpresaAtiva());
  const [planoAtual, setPlanoAtual] = useState(() => getPlanoAtual());
  const [limiteInfo, setLimiteInfo] = useState(() => verificarLimite());
  const [showLimitModal, setShowLimitModal] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const concluidos = resultados.filter((item) => item.status === 'concluido').length;
  const erros = resultados.filter((item) => item.status === 'erro').length;

  useEffect(() => {
    const syncContext = () => {
      const empresa = getEmpresaAtiva();

      setEmpresaAtiva(empresa);
      setPlanoAtual(getPlanoAtual());
      setLimiteInfo(verificarLimite());

      if (empresa) {
        setErp(empresa.erp);
        setUf(empresa.uf);
        setRegime(empresa.regime);
      }
    };

    window.addEventListener(TAXIO_DATA_EVENT, syncContext as EventListener);

    return () => window.removeEventListener(TAXIO_DATA_EVENT, syncContext as EventListener);
  }, []);

  useEffect(() => {
    if (empresaAtiva) {
      setErp(empresaAtiva.erp);
      setUf(empresaAtiva.uf);
      setRegime(empresaAtiva.regime);
    }
  }, [empresaAtiva?.id]);

  function resetLoteState() {
    setProgress(0);
    setFileName('');
    setError(null);
    setStatusMensagem(null);
    setTotalProdutos(0);
    setResultados([]);
  }

  async function processarArquivo(file: File) {
    if (!erp || !uf || !regime) {
      setError('Selecione ERP, regime tributario e UF antes de enviar o arquivo.');
      return;
    }

    setError(null);
    setStatusMensagem(null);
    setProgress(0);
    setResultados([]);
    setFileName(file.name);

    try {
      const texto = await file.text();
      const produtos = parsearCSV(texto);

      if (!produtos.length) {
        setError('Nenhuma linha valida foi encontrada no CSV enviado.');
        setFileName('');
        return;
      }

      const produtosComIA = produtos.filter(
        (produto) => !produto.ncm || produto.ncm.replace(/\D/g, '').length < 8
      );
      const limite = verificarLimiteParaQuantidade(produtosComIA.length);

      setLimiteInfo(verificarLimite());
      setPlanoAtual(getPlanoAtual());

      if (!limite.podeContinuar) {
        setShowLimitModal(true);
        setFileName('');
        return;
      }

      setProcessing(true);
      setTotalProdutos(produtos.length);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const resultadosProcessados = await processarLote(
        produtos,
        uf,
        erp,
        regime,
        (index, total, item) => {
          setProgress(Math.round((index / total) * 100));
          setTotalProdutos(total);
          setResultados((current) => [...current, item]);
        },
        controller.signal
      );

      resultadosProcessados
        .filter((item) => item.status === 'concluido' && item.resultado)
        .forEach((item) => {
          const risco = calcularRisco(item.resultado!, uf, regime);

          salvarClassificacao(item.descricao, item.resultado!, 'lote', erp, uf, {
            codigo: item.codigo_produto,
            regime,
            nivelRisco: risco.nivel,
            empresaId: empresaAtiva?.id,
            empresaNome: empresaAtiva?.razaoSocial
          });
        });

      if (controller.signal.aborted) {
        setStatusMensagem(
          `Processamento cancelado apos ${resultadosProcessados.length} de ${produtos.length} itens.`
        );
      } else if (resultadosProcessados.some((item) => item.status === 'erro')) {
        setStatusMensagem(
          `Lote concluido com ${resultadosProcessados.length} itens processados e ${
            resultadosProcessados.filter((item) => item.status === 'erro').length
          } erro(s).`
        );
      } else {
        setStatusMensagem(`Lote concluido com ${resultadosProcessados.length} classificacoes.`);
      }

      await dispararWebhook('lote_concluido', {
        totalProdutos: resultadosProcessados.length,
        totalAprovados: resultadosProcessados.filter((item) => item.status === 'concluido').length,
        totalErros: resultadosProcessados.filter((item) => item.status === 'erro').length,
        arquivo: file.name
      });

      if (resultadosProcessados.some((item) => item.status === 'erro')) {
        await dispararWebhook('erro_lote', {
          totalProdutos: resultadosProcessados.length,
          totalErros: resultadosProcessados.filter((item) => item.status === 'erro').length,
          arquivo: file.name
        });
      }

      setLimiteInfo(verificarLimite());
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setStatusMensagem('Processamento cancelado pelo usuario.');
      } else {
        setError('Falha ao processar o CSV. Confira o arquivo e tente novamente.');
        console.error(error);
      }
    } finally {
      setProcessing(false);
      abortControllerRef.current = null;
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      processarArquivo(file);
    }

    event.target.value = '';
  }

  function handleCancel() {
    abortControllerRef.current?.abort();
  }

  function handleDownloadResultados() {
    if (!resultados.length) {
      return;
    }

    const csv = gerarCSVResultado(resultados);
    const baseName = fileName.replace(/\.[^.]+$/, '') || 'lote';
    const today = new Date().toISOString().slice(0, 10);

    downloadCSV(csv, `taxio_resultado_${baseName}_${today}.csv`);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Consulta em lote
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Classifique milhares de produtos de uma vez
        </p>
      </div>

      {limiteInfo.limite !== -1 && limiteInfo.percentual >= 80 && (
        <div
          className="mb-6 rounded-2xl border px-4 py-3 text-sm"
          style={{
            borderColor: 'rgba(245, 158, 11, 0.35)',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            color: 'var(--warning)'
          }}
        >
          Voce usou {limiteInfo.percentual}% do seu limite mensal. {limiteInfo.usados} /{' '}
          {limiteInfo.limite} consultas no plano {planoAtual.nome}.
        </div>
      )}

      <TaxioCard>
        {empresaAtiva && (
          <div
            className="mb-4 rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-secondary)'
            }}
          >
            Empresa ativa: <span style={{ color: 'var(--text-primary)' }}>{empresaAtiva.razaoSocial}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <TaxioSelect
            label="ERP do cliente"
            options={erpOptions}
            value={erp}
            disabled={processing}
            onChange={(event) => {
              setErp(event.target.value);
              resetLoteState();
            }}
          />
          <TaxioSelect
            label="Regime Tributario"
            options={regimeOptions}
            value={regime}
            disabled={processing}
            onChange={(event) => {
              setRegime(event.target.value as RegimeTributario);
              resetLoteState();
            }}
          />
          <TaxioSelect
            label="Estado (UF)"
            options={ufOptions}
            value={uf}
            disabled={processing}
            onChange={(event) => {
              setUf(event.target.value);
              resetLoteState();
            }}
          />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleInputChange}
        />

        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
            processing ? 'cursor-progress' : 'cursor-pointer'
          } ${isDragging ? 'scale-[1.02]' : ''}`}
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: isDragging ? 'var(--accent-royal)' : 'rgba(255, 255, 255, 0.12)'
          }}
          onDragOver={(event) => {
            event.preventDefault();

            if (!processing) {
              setIsDragging(true);
            }
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);

            if (!processing) {
              const file = event.dataTransfer.files?.[0];

              if (file) {
                processarArquivo(file);
              }
            }
          }}
          onClick={() => {
            if (!processing) {
              inputRef.current?.click();
            }
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(26, 78, 216, 0.15)' }}
          >
            <Upload className="w-8 h-8" style={{ color: 'var(--accent-royal)' }} />
          </div>
          <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Arraste o CSV aqui
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            ou clique para selecionar. Maximo recomendado: 10.000 produtos
          </p>
          <TaxioButton variant="outline" disabled={processing}>
            Selecionar arquivo
          </TaxioButton>
        </div>

        <div className="mt-6">
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            Colunas esperadas no CSV:
          </p>
          <div className="flex flex-wrap gap-2">
            {['codigo_produto', 'descricao', 'unidade', 'ncm (opcional)'].map((coluna) => (
              <TaxioBadge key={coluna} variant="info">
                {coluna}
              </TaxioBadge>
            ))}
          </div>
        </div>

        {error && (
          <div
            className="mt-6 rounded-xl border px-4 py-3 text-sm"
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

      {(processing || resultados.length > 0 || statusMensagem) && (
        <TaxioCard className="mt-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {fileName || 'Processamento do lote'}
              </h3>
              <TaxioBadge
                variant={processing ? 'processing' : erros > 0 ? 'warning' : 'success'}
                pulse={processing}
              >
                {processing ? 'Processando' : erros > 0 ? 'Concluido com avisos' : 'Concluido'}
              </TaxioBadge>
            </div>
            {processing ? (
              <button
                onClick={handleCancel}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                title="Cancelar processamento"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <TaxioButton
                variant="outline"
                icon={<Download className="w-4 h-4" />}
                disabled={!resultados.length}
                onClick={handleDownloadResultados}
              >
                Baixar resultado
              </TaxioButton>
            )}
          </div>

          <div
            className="h-2 rounded-full overflow-hidden mb-3"
            style={{ backgroundColor: 'var(--bg-app)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                backgroundColor: 'var(--accent-royal)'
              }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--text-primary)' }}>
              {resultados.length} de {totalProdutos || resultados.length} produtos processados
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {concluidos} concluidos • {erros} erros
            </span>
          </div>

          {statusMensagem && (
            <div
              className="mt-4 rounded-xl border px-4 py-3 text-sm"
              style={{
                borderColor:
                  erros > 0 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)',
                backgroundColor:
                  erros > 0 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                color: erros > 0 ? 'var(--warning)' : 'var(--success)'
              }}
            >
              {statusMensagem}
            </div>
          )}
        </TaxioCard>
      )}

      <TaxioCard
        title={resultados.length ? 'Itens processados' : 'Como o arquivo sera interpretado'}
        className="mt-6"
        delay={0.1}
      >
        {resultados.length ? (
          <div className="space-y-3">
            {resultados.slice(0, 8).map((item, index) => (
              <div
                key={`${item.codigo_produto}-${index}`}
                className="flex items-start gap-3 p-4 rounded-lg"
                style={{ backgroundColor: 'var(--bg-elevated)' }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(26, 78, 216, 0.15)' }}
                >
                  <FileText className="w-5 h-5" style={{ color: 'var(--accent-light)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {item.descricao}
                    </p>
                    <TaxioBadge
                      variant={
                        item.status === 'concluido'
                          ? 'success'
                          : item.status === 'erro'
                            ? 'warning'
                            : 'processing'
                      }
                    >
                      {item.status === 'concluido'
                        ? 'Concluido'
                        : item.status === 'erro'
                          ? 'Erro'
                          : 'Processando'}
                    </TaxioBadge>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Codigo: {item.codigo_produto || '-'} • NCM: {item.resultado?.ncm || item.ncm || '-'}
                  </p>
                  {item.resultado?.temSubstituicaoTributaria && (
                    <p className="text-xs mt-1" style={{ color: 'var(--warning)' }}>
                      Produto sujeito a ST
                    </p>
                  )}
                  {item.erro && (
                    <p className="text-xs mt-1" style={{ color: 'var(--warning)' }}>
                      {item.erro}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {resultados.length > 8 && (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Mostrando 8 de {resultados.length} itens processados.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>O parser aceita arquivos com separador por virgula ou ponto e virgula.</p>
            <p>
              Se uma linha ja vier com NCM preenchido, o lote reaproveita esse codigo e marca a
              classificacao com confianca 100.
            </p>
            <p>
              Ao concluir o lote, o Taxio pode disparar webhook com totais do processamento quando a
              integracao estiver configurada.
            </p>
          </div>
        )}
      </TaxioCard>

      {showLimitModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowLimitModal(false)} />
          <div
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto rounded-2xl border p-6 z-50"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 mt-0.5" style={{ color: 'var(--warning)' }} />
              <div>
                <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Limite do plano atingido
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Voce atingiu o limite do plano {planoAtual.nome}. Faca upgrade para continuar.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <TaxioButton variant="outline" className="flex-1" onClick={() => setShowLimitModal(false)}>
                Fechar
              </TaxioButton>
              <TaxioButton
                className="flex-1"
                onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
              >
                Fazer upgrade
              </TaxioButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
