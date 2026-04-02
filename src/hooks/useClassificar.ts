import { useState } from 'react';
import {
  ClassificacaoResult,
  RegimeTributario,
  classificarProduto
} from '../services/groq';
import { NCMInfo, validarNCM } from '../services/validarNCM';
import { RiscoFiscal, calcularRisco } from '../services/risco';

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function verificarDivergenciaTIPI(descricaoIA: string, descricaoTIPI: string) {
  const tokensIA = new Set(normalizeText(descricaoIA).split(' ').filter((token) => token.length > 3));
  const tokensTIPI = new Set(
    normalizeText(descricaoTIPI).split(' ').filter((token) => token.length > 3)
  );

  if (!tokensIA.size || !tokensTIPI.size) {
    return false;
  }

  const emComum = [...tokensTIPI].filter((token) => tokensIA.has(token)).length;
  const similaridade = emComum / Math.max(tokensTIPI.size, 1);

  return similaridade < 0.35;
}

export function useClassificar() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ClassificacaoResult | null>(null);
  const [ncmInfo, setNcmInfo] = useState<NCMInfo | null>(null);
  const [riscoFiscal, setRiscoFiscal] = useState<RiscoFiscal | null>(null);
  const [temDivergenciaTIPI, setTemDivergenciaTIPI] = useState(false);

  async function classificar(
    descricao: string,
    uf: string,
    erp: string,
    regime: RegimeTributario
  ) {
    if (!descricao.trim()) {
      setError('Informe a descricao do produto');
      return;
    }

    if (!uf.trim()) {
      setError('Selecione o Estado (UF)');
      return;
    }

    if (!erp.trim()) {
      setError('Selecione o ERP para continuar');
      return;
    }

    setLoading(true);
    setError(null);
    setResultado(null);
    setNcmInfo(null);
    setRiscoFiscal(null);
    setTemDivergenciaTIPI(false);

    try {
      const response = await classificarProduto(descricao, uf, erp, regime);
      const validacao = await validarNCM(response.ncm);
      const risco = calcularRisco(response, uf, regime);

      setResultado(response);
      setNcmInfo(validacao);
      setRiscoFiscal(risco);
      setTemDivergenciaTIPI(
        validacao.valido
          ? verificarDivergenciaTIPI(response.descricaoNCM, validacao.descricao)
          : false
      );
    } catch (error) {
      setError('Erro ao classificar. Tente novamente.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function limpar() {
    setResultado(null);
    setError(null);
    setNcmInfo(null);
    setRiscoFiscal(null);
    setTemDivergenciaTIPI(false);
  }

  return {
    classificar,
    loading,
    error,
    resultado,
    ncmInfo,
    riscoFiscal,
    temDivergenciaTIPI,
    limpar
  };
}
