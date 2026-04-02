import { ClassificacaoResult } from './groq';

export type NivelRisco = 'baixo' | 'medio' | 'alto';

export interface RiscoFiscal {
  nivel: NivelRisco;
  pontuacao: number;
  motivos: string[];
  recomendacoes: string[];
}

export function calcularRisco(
  resultado: ClassificacaoResult,
  uf: string,
  regime: string
): RiscoFiscal {
  const motivos: string[] = [];
  const recomendacoes: string[] = [];
  let pontuacao = 0;

  if (resultado.confianca < 85) {
    pontuacao += 30;
    motivos.push(`Confianca da IA abaixo de 85% (${resultado.confianca}%)`);
    recomendacoes.push('Revisar manualmente com um especialista fiscal');
  } else if (resultado.confianca < 95) {
    pontuacao += 10;
    motivos.push('Confianca moderada — recomenda-se validacao');
  }

  if (resultado.temSubstituicaoTributaria) {
    pontuacao += 15;
    motivos.push('Produto sujeito a Substituicao Tributaria');
    recomendacoes.push(`Verificar protocolo ICMS ST vigente para ${uf}`);
  }

  if (regime === 'simples_nacional') {
    const cstsSN = ['102', '103', '300', '400', '500', '900'];

    if (!cstsSN.includes(resultado.cst)) {
      pontuacao += 40;
      motivos.push(`CST ${resultado.cst} incompativel com Simples Nacional`);
      recomendacoes.push('Corrigir CST para a faixa 100-900 (Simples Nacional)');
    }
  } else {
    const cstsNormais = [
      '000',
      '010',
      '020',
      '030',
      '040',
      '041',
      '050',
      '060',
      '070',
      '090',
      '200',
      '500'
    ];

    if (!cstsNormais.includes(resultado.cst)) {
      pontuacao += 40;
      motivos.push(`CST ${resultado.cst} incompativel com ${regime}`);
      recomendacoes.push('Verificar tabela CST para o regime tributario informado');
    }
  }

  if (resultado.temSubstituicaoTributaria && !resultado.cest) {
    pontuacao += 20;
    motivos.push('Produto com ST mas sem CEST definido');
    recomendacoes.push('Consultar tabela CEST do Convenio ICMS 142/2018');
  }

  const nivel: NivelRisco = pontuacao >= 50 ? 'alto' : pontuacao >= 20 ? 'medio' : 'baixo';

  if (nivel === 'baixo' && motivos.length === 0) {
    motivos.push('Classificacao dentro dos parametros esperados');
  }

  return { nivel, pontuacao, motivos, recomendacoes };
}
