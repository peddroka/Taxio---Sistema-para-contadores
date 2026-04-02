import { NivelRisco } from './risco';
import { ClassificacaoResult } from './groq';
import { emitTaxioDataUpdated } from './events';

export interface ClassificacaoSalva {
  id: string;
  codigo: string;
  produto: string;
  ncm: string;
  cest: string;
  cst: string;
  cClassTrib: string;
  confianca: number;
  origem: 'ia' | 'lote' | 'manual';
  data: string;
  criadoEm: string;
  status: 'aprovado' | 'revisar';
  erp: string;
  uf: string;
  regime: string;
  temST: boolean;
  observacoes: string;
  nivelRisco: NivelRisco;
  empresaId?: string;
  empresaNome?: string;
  comentario?: string;
}

const STORAGE_KEY = 'taxio_classificacoes';

export interface SalvarClassificacaoOptions {
  codigo?: string;
  regime?: string;
  nivelRisco?: NivelRisco;
  empresaId?: string;
  empresaNome?: string;
  comentario?: string;
}

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `taxio-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function persistList(lista: ClassificacaoSalva[]) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  emitTaxioDataUpdated('classificacoes');
}

export function salvarClassificacao(
  produto: string,
  resultado: ClassificacaoResult,
  origem: 'ia' | 'lote' | 'manual',
  erp: string,
  uf: string,
  options: SalvarClassificacaoOptions = {}
): ClassificacaoSalva {
  const criadoEm = new Date().toISOString();
  const nova: ClassificacaoSalva = {
    id: generateId(),
    codigo: options.codigo || '',
    produto,
    ncm: resultado.ncm,
    cest: resultado.cest,
    cst: resultado.cst,
    cClassTrib: resultado.cClassTrib,
    confianca: resultado.confianca,
    origem,
    data: new Date(criadoEm).toLocaleDateString('pt-BR'),
    criadoEm,
    status: resultado.confianca >= 90 ? 'aprovado' : 'revisar',
    erp,
    uf,
    regime: options.regime || 'lucro_presumido',
    temST: resultado.temSubstituicaoTributaria,
    observacoes: resultado.observacoes,
    nivelRisco: options.nivelRisco || 'baixo',
    empresaId: options.empresaId,
    empresaNome: options.empresaNome,
    comentario: options.comentario
  };
  const lista = listarClassificacoes();

  lista.unshift(nova);
  persistList(lista);

  return nova;
}

export function listarClassificacoes(): ClassificacaoSalva[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const lista = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Array<
      Partial<ClassificacaoSalva>
    >;

    return lista
      .map((item) => ({
        id: String(item.id || generateId()),
        codigo: String(item.codigo || ''),
        produto: String(item.produto || ''),
        ncm: String(item.ncm || ''),
        cest: String(item.cest || ''),
        cst: String(item.cst || ''),
        cClassTrib: String(item.cClassTrib || ''),
        confianca: Number(item.confianca || 0),
        origem: (item.origem || 'ia') as ClassificacaoSalva['origem'],
        data: String(item.data || ''),
        criadoEm: String(item.criadoEm || ''),
        status: (item.status || 'revisar') as ClassificacaoSalva['status'],
        erp: String(item.erp || ''),
        uf: String(item.uf || ''),
        regime: String(item.regime || 'lucro_presumido'),
        temST: Boolean(item.temST),
        observacoes: String(item.observacoes || ''),
        nivelRisco: (item.nivelRisco || 'baixo') as NivelRisco,
        empresaId: item.empresaId ? String(item.empresaId) : undefined,
        empresaNome: item.empresaNome ? String(item.empresaNome) : undefined,
        comentario: item.comentario ? String(item.comentario) : undefined
      }))
      .sort((a, b) => {
        const aTime = new Date(a.criadoEm || a.data).getTime();
        const bTime = new Date(b.criadoEm || b.data).getTime();

        return bTime - aTime;
      });
  } catch {
    return [];
  }
}

export function deletarClassificacao(id: string) {
  const lista = listarClassificacoes().filter((classificacao) => classificacao.id !== id);

  persistList(lista);
}

export function atualizarComentario(id: string, comentario: string): void {
  const lista = listarClassificacoes().map((classificacao) =>
    classificacao.id === id ? { ...classificacao, comentario } : classificacao
  );

  persistList(lista);
}
