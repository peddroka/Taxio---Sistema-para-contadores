export interface NCMInfo {
  codigo: string;
  descricao: string;
  aliquotaIPI: number;
  unidade: string;
  valido: boolean;
}

interface BrasilApiNCM {
  codigo: string;
  descricao: string;
  aliquota_ipi?: string;
  unidade_medida?: string;
}

const BRASIL_API_NCM_URL = 'https://brasilapi.com.br/api/ncm/v1';

function normalizarResposta(item: BrasilApiNCM): NCMInfo {
  return {
    codigo: item.codigo,
    descricao: item.descricao,
    aliquotaIPI: Number.parseFloat(item.aliquota_ipi || '0') || 0,
    unidade: item.unidade_medida || 'UN',
    valido: true
  };
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

async function buscarNCMNaBrasilAPI(search: string): Promise<BrasilApiNCM[]> {
  const response = await fetch(`${BRASIL_API_NCM_URL}?search=${encodeURIComponent(search)}`);

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as BrasilApiNCM | BrasilApiNCM[];

  if (Array.isArray(data)) {
    return data;
  }

  return data?.codigo ? [data] : [];
}

export async function validarNCM(ncm: string): Promise<NCMInfo> {
  const codigo = onlyDigits(ncm);

  if (codigo.length !== 8) {
    return {
      codigo,
      descricao: '',
      aliquotaIPI: 0,
      unidade: '',
      valido: false
    };
  }

  try {
    const resultados = await buscarNCMNaBrasilAPI(codigo);
    const match =
      resultados.find((item) => onlyDigits(item.codigo) === codigo) ||
      resultados.find((item) => onlyDigits(item.codigo).startsWith(codigo));

    if (!match) {
      return { codigo, descricao: '', aliquotaIPI: 0, unidade: '', valido: false };
    }

    return normalizarResposta(match);
  } catch {
    return { codigo, descricao: '', aliquotaIPI: 0, unidade: '', valido: false };
  }
}

export async function buscarNCMPorDescricao(descricao: string): Promise<NCMInfo[]> {
  try {
    const data = await buscarNCMNaBrasilAPI(descricao);

    return data.slice(0, 10).map(normalizarResposta);
  } catch {
    return [];
  }
}
