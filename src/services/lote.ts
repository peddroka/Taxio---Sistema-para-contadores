import { ClassificacaoResult, RegimeTributario, classificarProduto } from './groq';

export interface ProdutoLote {
  codigo_produto: string;
  descricao: string;
  unidade: string;
  ncm?: string;
}

export interface ResultadoLote extends ProdutoLote {
  resultado?: ClassificacaoResult;
  erro?: string;
  status: 'pendente' | 'processando' | 'concluido' | 'erro';
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function detectDelimiter(headerLine: string) {
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;

  return semicolonCount > commaCount ? ';' : ',';
}

function parseCSVLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }

      continue;
    }

    if (character === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += character;
  }

  values.push(current.trim());

  return values.map((value) => value.replace(/^\uFEFF/, ''));
}

function formatNCM(value: string) {
  const digits = value.replace(/\D/g, '');

  if (digits.length !== 8) {
    return value;
  }

  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
}

export function parsearCSV(texto: string): ProdutoLote[] {
  const linhas = texto
    .replace(/\r/g, '')
    .split('\n')
    .map((linha) => linha.trim())
    .filter(Boolean);

  if (linhas.length < 2) {
    return [];
  }

  const delimiter = detectDelimiter(linhas[0]);
  const headers = parseCSVLine(linhas[0], delimiter).map(normalizeHeader);

  return linhas
    .slice(1)
    .map((linha) => {
      const valores = parseCSVLine(linha, delimiter);
      const item = headers.reduce<Record<string, string>>((accumulator, header, index) => {
        accumulator[header] = (valores[index] || '').trim();

        return accumulator;
      }, {});

      return {
        codigo_produto: item.codigo_produto || item.codigo || '',
        descricao: item.descricao || item.produto || item.nome || '',
        unidade: item.unidade || item.und || 'UN',
        ncm: item.ncm ? formatNCM(item.ncm) : undefined
      };
    })
    .filter((produto) => produto.descricao);
}

export async function processarLote(
  produtos: ProdutoLote[],
  uf: string,
  erp: string,
  regime: RegimeTributario,
  onProgress: (index: number, total: number, item: ResultadoLote) => void,
  signal?: AbortSignal
): Promise<ResultadoLote[]> {
  const resultados: ResultadoLote[] = [];

  for (let index = 0; index < produtos.length; index += 1) {
    if (signal?.aborted) {
      break;
    }

    const produto = produtos[index];

    try {
      if (produto.ncm && produto.ncm.replace(/\D/g, '').length >= 8) {
        const item: ResultadoLote = {
          ...produto,
          status: 'concluido',
          resultado: {
            ncm: formatNCM(produto.ncm),
            cest: '',
            cst: '000',
            cClassTrib: '000',
            confianca: 100,
            descricaoNCM: 'NCM fornecido pelo usuario',
            descricaoCEST: '',
            descricaoCST: '',
            descricaoCClassTrib: '',
            temSubstituicaoTributaria: false,
            observacoes: 'NCM informado no arquivo de entrada.'
          }
        };

        resultados.push(item);
        onProgress(index + 1, produtos.length, item);
        continue;
      }

      const resultado = await classificarProduto(produto.descricao, uf, erp, regime, signal);
      const item: ResultadoLote = { ...produto, resultado, status: 'concluido' };

      resultados.push(item);
      onProgress(index + 1, produtos.length, item);

      if (index < produtos.length - 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 300));
      }
    } catch (error) {
      if (signal?.aborted) {
        break;
      }

      const item: ResultadoLote = {
        ...produto,
        status: 'erro',
        erro: error instanceof Error ? error.message : 'Falha na classificacao'
      };

      resultados.push(item);
      onProgress(index + 1, produtos.length, item);
    }
  }

  return resultados;
}
