import { RegimeTributario } from './groq';
import { emitTaxioDataUpdated } from './events';

export interface Empresa {
  id: string;
  cnpj: string;
  razaoSocial: string;
  regime: RegimeTributario;
  erp: string;
  uf: string;
  cor: string;
  ativa: boolean;
  criadaEm: string;
}

const EMPRESAS_KEY = 'taxio_empresas';
const EMPRESA_ATIVA = 'taxio_empresa_ativa';

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `empresa-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function persist(lista: Empresa[]) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(EMPRESAS_KEY, JSON.stringify(lista));
  emitTaxioDataUpdated('empresas');
}

export function criarEmpresa(dados: Omit<Empresa, 'id' | 'criadaEm'>): Empresa {
  const lista = listarEmpresas().map((empresa) => ({
    ...empresa,
    ativa: dados.ativa ? false : empresa.ativa
  }));
  const empresa: Empresa = {
    ...dados,
    id: generateId(),
    criadaEm: new Date().toISOString()
  };

  lista.push(empresa);
  persist(lista);

  if (empresa.ativa) {
    setEmpresaAtiva(empresa.id);
  }

  return empresa;
}

export function listarEmpresas(): Empresa[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    return (JSON.parse(localStorage.getItem(EMPRESAS_KEY) || '[]') as Empresa[]).sort((a, b) =>
      a.razaoSocial.localeCompare(b.razaoSocial)
    );
  } catch {
    return [];
  }
}

export function getEmpresaAtiva(): Empresa | null {
  try {
    const id = localStorage.getItem(EMPRESA_ATIVA);

    if (!id) {
      return null;
    }

    return listarEmpresas().find((empresa) => empresa.id === id) || null;
  } catch {
    return null;
  }
}

export function setEmpresaAtiva(id: string): void {
  const lista = listarEmpresas().map((empresa) => ({
    ...empresa,
    ativa: empresa.id === id
  }));

  localStorage.setItem(EMPRESA_ATIVA, id);
  persist(lista);
}

export function atualizarEmpresa(id: string, dados: Partial<Omit<Empresa, 'id' | 'criadaEm'>>) {
  const lista = listarEmpresas().map((empresa) =>
    empresa.id === id ? { ...empresa, ...dados } : dados.ativa ? { ...empresa, ativa: false } : empresa
  );

  persist(lista);

  if (dados.ativa) {
    setEmpresaAtiva(id);
  }
}

export function deletarEmpresa(id: string): void {
  const lista = listarEmpresas().filter((empresa) => empresa.id !== id);
  const ativa = getEmpresaAtiva();

  localStorage.setItem(EMPRESAS_KEY, JSON.stringify(lista));

  if (ativa?.id === id) {
    const fallback = lista[0];

    if (fallback) {
      localStorage.setItem(EMPRESA_ATIVA, fallback.id);
      persist(
        lista.map((empresa) => ({
          ...empresa,
          ativa: empresa.id === fallback.id
        }))
      );
      return;
    }

    localStorage.removeItem(EMPRESA_ATIVA);
  }

  emitTaxioDataUpdated('empresas');
}

export function formatarCNPJ(cnpj: string): string {
  const nums = cnpj.replace(/\D/g, '');

  if (nums.length !== 14) {
    return cnpj;
  }

  return nums.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function aplicarMascaraCNPJ(cnpj: string) {
  const nums = cnpj.replace(/\D/g, '').slice(0, 14);

  if (nums.length <= 2) return nums;
  if (nums.length <= 5) return `${nums.slice(0, 2)}.${nums.slice(2)}`;
  if (nums.length <= 8) return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5)}`;
  if (nums.length <= 12) {
    return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5, 8)}/${nums.slice(8)}`;
  }

  return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5, 8)}/${nums.slice(8, 12)}-${nums.slice(12)}`;
}
