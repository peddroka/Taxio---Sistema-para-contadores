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

function normalizarResposta(item: BrasilApiNCM): NCMInfo {
  return {
    codigo: item.codigo,
    descricao: item.descricao,
    aliquotaIPI: Number.parseFloat(item.aliquota_ipi || '0') || 0,
    unidade: item.unidade_medida || 'UN',
    valido: true
  };
}

export async function validarNCM(ncm: string): Promise<NCMInfo> {
  const codigo = ncm.replace(/\D/g, '');

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
    const response = await fetch(`https://brasilapi.com.br/api/ncm/v1/${codigo}`);

    if (!response.ok) {
      return { codigo, descricao: '', aliquotaIPI: 0, unidade: '', valido: false };
    }

    const data = (await response.json()) as BrasilApiNCM;

    return normalizarResposta(data);
  } catch {
    return { codigo, descricao: '', aliquotaIPI: 0, unidade: '', valido: false };
  }
}

export async function buscarNCMPorDescricao(descricao: string): Promise<NCMInfo[]> {
  try {
    const response = await fetch(
      `https://brasilapi.com.br/api/ncm/v1?search=${encodeURIComponent(descricao)}`
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as BrasilApiNCM[];

    return data.slice(0, 10).map(normalizarResposta);
  } catch {
    return [];
  }
}
