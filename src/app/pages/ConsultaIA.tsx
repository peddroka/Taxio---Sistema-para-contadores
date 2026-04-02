import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { ChevronDown, ChevronUp, Download, Sparkles, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { TaxioBadge } from '../components/taxio/TaxioBadge';
import { TaxioButton } from '../components/taxio/TaxioButton';
import { TaxioCard } from '../components/taxio/TaxioCard';
import { TaxioSelect } from '../components/taxio/TaxioSelect';
import { TaxioTextarea } from '../components/taxio/TaxioTextarea';
import { useClassificar } from '../../hooks/useClassificar';
import { erpOptions, regimeOptions, ufOptions } from '../../services/catalogos';
import { ERPType, downloadCSV, gerarCSVPorERP } from '../../services/exportar';
import { TAXIO_DATA_EVENT } from '../../services/events';
import { getEmpresaAtiva } from '../../services/empresas';
import { RegimeTributario } from '../../services/groq';
import { getPlanoAtual, verificarLimite } from '../../services/plano';
import { ClassificacaoSalva, salvarClassificacao } from '../../services/storage';
import { dispararWebhook } from '../../services/webhook';

function mapERPToExport(value: string): ERPType {
  if (value === 'totvs' || value === 'sap' || value === 'omie' || value === 'bling') {
    return value;
  }

  return 'generico';
}

function getRiskStyle(nivel: 'baixo' | 'medio' | 'alto') {
  if (nivel === 'alto') {
    return {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      color: 'var(--danger)',
      borderColor: 'rgba(239, 68, 68, 0.35)'
    };
  }

  if (nivel === 'medio') {
    return {
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      color: 'var(--warning)',
      borderColor: 'rgba(245, 158, 11, 0.35)'
    };
  }

  return {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: 'var(--success)',
    borderColor: 'rgba(16, 185, 129, 0.35)'
  };
}

export default function ConsultaIA() {
  const location = useLocation();
  const previousState = location.state as
    | {
        descricao?: string;
        erp?: string;
        uf?: string;
        regime?: RegimeTributario;
        resultadoAnterior?: ClassificacaoSalva;
      }
    | undefined;
  const [descricao, setDescricao] = useState('');
  const [erp, setErp] = useState('');
  const [uf, setUf] = useState('');
  const [regime, setRegime] = useState<RegimeTributario>('lucro_presumido');
  const [ultimaConsulta, setUltimaConsulta] = useState<{
    descricao: string;
    erp: string;
    uf: string;
    regime: RegimeTributario;
    token: string;
    empresaId?: string;
    empresaNome?: string;
  } | null>(null);
  const [empresaAtiva, setEmpresaAtiva] = useState(() => getEmpresaAtiva());
  const [statusMensagem, setStatusMensagem] = useState<string | null>(null);
  const [showRiskDetails, setShowRiskDetails] = useState(false);
  const [showPreviousResult, setShowPreviousResult] = useState(true);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limiteInfo, setLimiteInfo] = useState(() => verificarLimite());
  const [planoAtual, setPlanoAtual] = useState(() => getPlanoAtual());
  const saveRef = useRef<string | null>(null);
  const {
    classificar,
    loading,
    error,
    resultado,
    ncmInfo,
    riscoFiscal,
    temDivergenciaTIPI,
    limpar
  } = useClassificar();

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

  useEffect(() => {
    if (!previousState) {
      return;
    }

    if (previousState.descricao) {
      setDescricao(previousState.descricao);
    }
    if (previousState.erp) {
      setErp(previousState.erp);
    }
    if (previousState.uf) {
      setUf(previousState.uf);
    }
    if (previousState.regime) {
      setRegime(previousState.regime);
    }
  }, [previousState]);

  useEffect(() => {
    if (!resultado || !ultimaConsulta || !riscoFiscal) {
      return;
    }

    if (saveRef.current === ultimaConsulta.token) {
      return;
    }

    salvarClassificacao(ultimaConsulta.descricao, resultado, 'ia', ultimaConsulta.erp, ultimaConsulta.uf, {
      regime: ultimaConsulta.regime,
      nivelRisco: riscoFiscal.nivel,
      empresaId: ultimaConsulta.empresaId,
      empresaNome: ultimaConsulta.empresaNome
    });
    void dispararWebhook('classificacao_salva', {
      produto: ultimaConsulta.descricao,
      origem: 'ia',
      ncm: resultado.ncm,
      cst: resultado.cst,
      empresaId: ultimaConsulta.empresaId
    });
    saveRef.current = ultimaConsulta.token;
    setStatusMensagem('Classificacao salva automaticamente no historico local.');
    setLimiteInfo(verificarLimite());
  }, [resultado, ultimaConsulta, riscoFiscal]);

  function resetResultado() {
    limpar();
    setStatusMensagem(null);
    setShowRiskDetails(false);
  }

  function handleClassificar() {
    const limite = verificarLimite();

    setLimiteInfo(limite);
    setPlanoAtual(getPlanoAtual());

    if (!limite.podeContinuar) {
      setShowLimitModal(true);
      return;
    }

    const token =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const payload = {
      descricao: descricao.trim(),
      erp,
      uf,
      regime,
      token,
      empresaId: empresaAtiva?.id,
      empresaNome: empresaAtiva?.razaoSocial
    };

    saveRef.current = null;
    setUltimaConsulta(payload);
    setStatusMensagem(null);
    setShowRiskDetails(false);
    classificar(payload.descricao, payload.uf, payload.erp, payload.regime);
  }

  function handleExportarResultado() {
    if (!resultado || !ultimaConsulta) {
      return;
    }

    const exportCsv = gerarCSVPorERP(
      [
        {
          codigo: '',
          descricao: ultimaConsulta.descricao,
          ncm: resultado.ncm,
          cest: resultado.cest,
          cst: resultado.cst,
          cClassTrib: resultado.cClassTrib
        }
      ],
      mapERPToExport(ultimaConsulta.erp)
    );
    const today = new Date().toISOString().slice(0, 10);

    downloadCSV(exportCsv, `taxio_export_${ultimaConsulta.erp || 'generico'}_${today}.csv`);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Consulta com IA
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Classifique produtos fiscalmente com inteligencia artificial
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

      <TaxioCard title="Dados do produto">
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

        <TaxioTextarea
          label="Descricao completa do produto"
          placeholder="Ex: Notebook Dell Inspiron 15 3000, Intel Core i5, 8GB RAM, SSD 256GB, Tela 15.6 Full HD, Windows 11 Home"
          rows={5}
          value={descricao}
          disabled={loading}
          onChange={(event) => {
            if (resultado || error) {
              resetResultado();
            }

            setDescricao(event.target.value);
          }}
          className="mb-4"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <TaxioSelect
            label="ERP do cliente"
            options={erpOptions}
            value={erp}
            disabled={loading}
            onChange={(event) => {
              if (resultado || error) {
                resetResultado();
              }

              setErp(event.target.value);
            }}
          />
          <TaxioSelect
            label="Regime Tributario"
            options={regimeOptions}
            value={regime}
            disabled={loading}
            onChange={(event) => {
              if (resultado || error) {
                resetResultado();
              }

              setRegime(event.target.value as RegimeTributario);
            }}
          />
          <TaxioSelect
            label="Estado (UF)"
            options={ufOptions}
            value={uf}
            disabled={loading}
            onChange={(event) => {
              if (resultado || error) {
                resetResultado();
              }

              setUf(event.target.value);
            }}
          />
        </div>

        <TaxioButton
          icon={<Sparkles className="w-4 h-4" />}
          onClick={handleClassificar}
          loading={loading}
          disabled={!descricao.trim() || !erp || !uf}
        >
          {loading ? 'Classificando...' : 'Classificar com IA'}
        </TaxioButton>

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

      {previousState?.resultadoAnterior && (
        <TaxioCard className="mt-6" elevated>
          <button
            className="w-full flex items-center justify-between text-left"
            onClick={() => setShowPreviousResult((current) => !current)}
          >
            <div>
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                Classificacao anterior
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {previousState.resultadoAnterior.produto}
              </p>
            </div>
            {showPreviousResult ? (
              <ChevronUp className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            ) : (
              <ChevronDown className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            )}
          </button>

          {showPreviousResult && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {[
                ['NCM', previousState.resultadoAnterior.ncm],
                ['CEST', previousState.resultadoAnterior.cest || '-'],
                ['CST', previousState.resultadoAnterior.cst],
                ['cClassTrib', previousState.resultadoAnterior.cClassTrib]
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border px-3 py-3"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)' }}
                >
                  <div className="text-[10px] uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    {label}
                  </div>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TaxioCard>
      )}

      {resultado && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-6"
        >
          <TaxioCard elevated accentBorder>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(26, 78, 216, 0.2)' }}
              >
                <Star className="w-5 h-5" style={{ color: 'var(--accent-light)' }} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  Resultado da classificacao
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  IA com {resultado.confianca}% de confianca
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {resultado.temSubstituicaoTributaria && (
                  <TaxioBadge variant="warning">Sujeito a ST</TaxioBadge>
                )}
                <TaxioBadge variant={resultado.confianca >= 90 ? 'success' : 'warning'} pulse>
                  {resultado.confianca >= 90 ? 'Aprovado' : 'Revisar'}
                </TaxioBadge>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {ncmInfo?.valido && (
                <span
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
                  style={{
                    borderColor: temDivergenciaTIPI ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)',
                    backgroundColor: temDivergenciaTIPI ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: temDivergenciaTIPI ? 'var(--warning)' : 'var(--success)'
                  }}
                >
                  {temDivergenciaTIPI ? 'Divergencia' : 'Validado TIPI ✓'}
                </span>
              )}

              {riscoFiscal && (
                <button
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    riscoFiscal.nivel === 'alto' ? 'animate-pulse' : ''
                  }`}
                  style={getRiskStyle(riscoFiscal.nivel)}
                  onClick={() => setShowRiskDetails((current) => !current)}
                >
                  Risco {riscoFiscal.nivel === 'baixo' ? 'Baixo' : riscoFiscal.nivel === 'medio' ? 'Medio' : 'Alto'}
                </button>
              )}
            </div>

            {riscoFiscal && showRiskDetails && (
              <div
                className="mb-6 rounded-xl border px-4 py-4"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)' }}
              >
                <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Motivos do risco ({riscoFiscal.pontuacao}/100)
                </div>
                <div className="space-y-2 mb-3">
                  {riscoFiscal.motivos.map((motivo) => (
                    <p key={motivo} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      • {motivo}
                    </p>
                  ))}
                </div>
                {!!riscoFiscal.recomendacoes.length && (
                  <>
                    <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Recomendacoes
                    </div>
                    <div className="space-y-2">
                      {riscoFiscal.recomendacoes.map((recomendacao) => (
                        <p key={recomendacao} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          • {recomendacao}
                        </p>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {[
                { label: 'NCM', value: resultado.ncm, desc: resultado.descricaoNCM },
                { label: 'CEST', value: resultado.cest || '-', desc: resultado.descricaoCEST || '-' },
                { label: 'CST', value: resultado.cst, desc: resultado.descricaoCST || '-' },
                {
                  label: 'cClassTrib',
                  value: resultado.cClassTrib,
                  desc: resultado.descricaoCClassTrib || '-'
                }
              ].map((field, index) => (
                <motion.div
                  key={field.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="p-4 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'rgba(26, 78, 216, 0.2)'
                  }}
                >
                  <div
                    className="text-[10px] font-semibold tracking-wider uppercase mb-1"
                    style={{ color: 'var(--accent-light)' }}
                  >
                    {field.label}
                  </div>
                  <div className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {field.value}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    {field.desc}
                  </div>
                  {field.label === 'NCM' && ncmInfo?.valido && (
                    <div className="mt-2 text-[11px]" style={{ color: 'var(--success)' }}>
                      TIPI: {ncmInfo.descricao} • IPI: {ncmInfo.aliquotaIPI}%
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {!!resultado.observacoes && (
              <div
                className="mb-6 rounded-xl border px-4 py-3"
                style={{
                  borderColor: 'rgba(245, 158, 11, 0.22)',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)'
                }}
              >
                <div
                  className="text-[10px] font-semibold tracking-wider uppercase mb-1"
                  style={{ color: 'var(--warning)' }}
                >
                  Observacoes
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {resultado.observacoes}
                </p>
              </div>
            )}

            {statusMensagem && (
              <div
                className="mb-4 rounded-xl border px-4 py-3 text-sm"
                style={{
                  borderColor: 'rgba(16, 185, 129, 0.35)',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  color: 'var(--success)'
                }}
              >
                {statusMensagem}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <TaxioButton
                variant="success"
                className="flex-1"
                icon={<Download className="w-4 h-4" />}
                onClick={handleExportarResultado}
              >
                Exportar CSV
              </TaxioButton>
              <TaxioButton variant="outline" className="flex-1" onClick={resetResultado}>
                Editar resultado
              </TaxioButton>
            </div>
          </TaxioCard>
        </motion.div>
      )}

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
            <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Limite do plano atingido
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Voce atingiu o limite do plano {planoAtual.nome}. Faca upgrade para continuar.
            </p>
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
