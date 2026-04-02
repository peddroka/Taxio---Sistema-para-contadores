import { emitTaxioDataUpdated } from './events';

export type TipoPlano = 'gratuito' | 'basico' | 'pro' | 'ilimitado';

export interface Plano {
  tipo: TipoPlano;
  nome: string;
  limiteMensal: number;
  cor: string;
}

export const PLANOS: Record<TipoPlano, Plano> = {
  gratuito: { tipo: 'gratuito', nome: 'Gratuito', limiteMensal: 30, cor: '#94A3B8' },
  basico: { tipo: 'basico', nome: 'Basico', limiteMensal: 200, cor: '#10B981' },
  pro: { tipo: 'pro', nome: 'Pro', limiteMensal: 1000, cor: '#1A4ED8' },
  ilimitado: { tipo: 'ilimitado', nome: 'Ilimitado', limiteMensal: -1, cor: '#F59E0B' }
};

const PLANO_KEY = 'taxio_plano';
const USO_KEY = 'taxio_uso_mensal';
const USO_HISTORICO_KEY = 'taxio_uso_historico';

interface UsoMensal {
  mes: string;
  count: number;
}

export interface UsoHistorico extends UsoMensal {}

function mesAtual() {
  return new Date().toISOString().slice(0, 7);
}

function persistUso(uso: UsoMensal) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(USO_KEY, JSON.stringify(uso));
  atualizarHistoricoUso(uso);
  emitTaxioDataUpdated('plano');
}

function atualizarHistoricoUso(uso: UsoMensal) {
  try {
    const historico = listarHistoricoUso().filter((item) => item.mes !== uso.mes);

    historico.unshift(uso);
    localStorage.setItem(USO_HISTORICO_KEY, JSON.stringify(historico.slice(0, 6)));
  } catch {
    localStorage.setItem(USO_HISTORICO_KEY, JSON.stringify([uso]));
  }
}

export function getPlanoAtual(): Plano {
  return PLANOS.ilimitado;
}

export function setPlano(tipo: TipoPlano): void {
  localStorage.setItem(PLANO_KEY, tipo);
  emitTaxioDataUpdated('plano');
}

export function getUsoMensal(): UsoMensal {
  try {
    const raw = localStorage.getItem(USO_KEY);
    const uso = raw ? (JSON.parse(raw) as UsoMensal) : null;
    const atual = mesAtual();

    if (!uso || uso.mes !== atual) {
      const zerado = { mes: atual, count: 0 };

      persistUso(zerado);
      return zerado;
    }

    return uso;
  } catch {
    const zerado = { mes: mesAtual(), count: 0 };

    persistUso(zerado);
    return zerado;
  }
}

export function incrementarUso(quantidade = 1): void {
  const uso = getUsoMensal();

  uso.count += quantidade;
  persistUso(uso);
}

export function verificarLimite() {
  const uso = getUsoMensal();

  return {
    podeContinuar: true,
    usados: uso.count,
    limite: -1,
    percentual: 0
  };
}

export function verificarLimiteParaQuantidade(_quantidade: number) {
  const uso = getUsoMensal();

  return {
    podeContinuar: true,
    usados: uso.count,
    limite: -1,
    percentual: 0,
    restante: -1
  };
}

export function listarHistoricoUso(): UsoHistorico[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    return JSON.parse(localStorage.getItem(USO_HISTORICO_KEY) || '[]') as UsoHistorico[];
  } catch {
    return [];
  }
}
