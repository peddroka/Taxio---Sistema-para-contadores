export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_MODEL = 'llama-3.3-70b-versatile';

export type RegimeTributario = 'simples_nacional' | 'lucro_presumido' | 'lucro_real';

export interface ClassificacaoResult {
  ncm: string;
  cest: string;
  cst: string;
  cClassTrib: string;
  confianca: number;
  descricaoNCM: string;
  descricaoCEST: string;
  descricaoCST: string;
  descricaoCClassTrib: string;
  temSubstituicaoTributaria: boolean;
  observacoes: string;
}

export interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

function onlyDigits(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

function formatNCM(value: unknown) {
  const digits = onlyDigits(value);

  if (digits.length !== 8) {
    throw new Error('NCM invalido retornado pela Groq');
  }

  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
}

function formatCEST(value: unknown) {
  const digits = onlyDigits(value);

  if (digits.length !== 7) {
    return '';
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 7)}`;
}

function formatThreeDigitsCode(value: unknown, fieldName: string) {
  const digits = onlyDigits(value);

  if (digits.length !== 3) {
    throw new Error(`${fieldName} invalido retornado pela Groq`);
  }

  return digits;
}

function normalizeBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'true' || normalized === 'sim' || normalized === 'yes') {
      return true;
    }

    if (normalized === 'false' || normalized === 'nao' || normalized === 'no') {
      return false;
    }
  }

  return false;
}

function extractJsonPayload(content: string) {
  const clean = content.replace(/```json|```/gi, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');

  if (start === -1 || end === -1 || end < start) {
    throw new Error('A Groq nao retornou um JSON valido');
  }

  return clean.slice(start, end + 1);
}

export function normalizeResult(value: unknown): ClassificacaoResult {
  const parsed = (value ?? {}) as Partial<ClassificacaoResult> & {
    confianca?: number | string;
  };
  const confianca = Number(parsed.confianca);

  if (!Number.isFinite(confianca)) {
    throw new Error('Confianca invalida retornada pela Groq');
  }

  const cst = formatThreeDigitsCode(parsed.cst, 'CST');
  const cClassTrib = formatThreeDigitsCode(parsed.cClassTrib, 'cClassTrib');
  const temSubstituicaoTributaria =
    normalizeBoolean(parsed.temSubstituicaoTributaria) ||
    ['010', '030', '060', '070', '500'].includes(cst) ||
    ['010', '030', '060', '070', '500'].includes(cClassTrib);

  return {
    ncm: formatNCM(parsed.ncm),
    cest: formatCEST(parsed.cest),
    cst,
    cClassTrib,
    confianca: Math.max(0, Math.min(100, Math.round(confianca))),
    descricaoNCM: String(parsed.descricaoNCM ?? ''),
    descricaoCEST: String(parsed.descricaoCEST ?? ''),
    descricaoCST: String(parsed.descricaoCST ?? ''),
    descricaoCClassTrib: String(parsed.descricaoCClassTrib ?? ''),
    temSubstituicaoTributaria,
    observacoes: String(parsed.observacoes ?? '').trim()
  };
}

export function buildGroqRequestBody(
  descricao: string,
  uf: string,
  erp: string,
  regime: RegimeTributario = 'lucro_presumido'
) {
  const regimeTexto = {
    simples_nacional: 'Simples Nacional',
    lucro_presumido: 'Lucro Presumido',
    lucro_real: 'Lucro Real'
  }[regime];

  const prompt = `
Voce e um especialista em classificacao fiscal brasileira com
conhecimento avancado em NCM, CEST, CST e cClassTrib.

Classifique o produto abaixo considerando TODAS as informacoes
fornecidas. Retorne APENAS um JSON valido, sem texto algum fora
do JSON.

=== DADOS DO PRODUTO ===
Produto: ${descricao}
Estado (UF): ${uf}
ERP do cliente: ${erp}
Regime Tributario: ${regimeTexto}

=== REGRAS DE CST POR REGIME ===

Se Simples Nacional:
  - 102: Tributada pelo Simples, sem direito a credito
  - 103: Isenta ou nao tributada, sem direito a credito
  - 300: Imune
  - 400: Nao tributada pelo Simples Nacional
  - 500: Com substituicao tributaria (contribuinte substituido)
  - 900: Outros

Se Lucro Presumido ou Lucro Real:
  - 000: Nacional, tributada integralmente
  - 010: Nacional, com substituicao tributaria
  - 020: Nacional, com reducao de base de calculo
  - 030: Nacional, isenta ou nao tributada com ST
  - 040: Nacional, isenta ou nao tributada
  - 041: Nacional, nao tributada (transferencia para ZFM)
  - 050: Nacional, suspensao
  - 060: Nacional, cobrada anteriormente por ST
  - 070: Nacional, com reducao e cobranca anterior por ST
  - 090: Nacional, outros
  - 200: Estrangeira (importacao direta), tributada integralmente
  - 500: Estrangeira, cobrada anteriormente por ST

=== REGRAS DE cClassTrib ===
  - 000: Tributada integralmente
  - 010: Tributada e com cobranca do ICMS por ST (retido)
  - 020: Com reducao da BC
  - 030: Isenta ou nao tributada e com cobranca do ICMS por ST
  - 040: Isenta
  - 041: Nao tributada
  - 050: Suspensao
  - 060: Com ICMS cobrado anteriormente por ST
  - 070: Com reducao da BC e cobranca do ICMS por ST
  - 090: Outros
  - 101: Tributada pelo Simples sem permissao de credito
  - 102: Tributada pelo Simples sem permissao de credito (saida)
  - 500: ICMS cobrado anteriormente por ST ou antecipacao

=== REGRA ESPECIAL PARA CELULARES E ELETRONICOS EM SP ===
Produtos como celulares, notebooks, tablets e eletronicos em geral
no estado de SP estao sujeitos a Substituicao Tributaria (ST).
Para Lucro Presumido/Real: CST deve ser 010 e cClassTrib 010.
Para Simples Nacional: CST deve ser 500 e cClassTrib 500.

=== FORMATO DE RESPOSTA ===
Retorne exatamente neste formato JSON:
{
  "ncm": "0000.00.00",
  "cest": "00.000.00",
  "cst": "000",
  "cClassTrib": "000",
  "confianca": 98,
  "descricaoNCM": "descricao oficial do codigo NCM",
  "descricaoCEST": "descricao oficial do codigo CEST",
  "descricaoCST": "descricao do CST com base no regime tributario",
  "descricaoCClassTrib": "descricao do cClassTrib",
  "temSubstituicaoTributaria": true,
  "observacoes": "observacao relevante sobre a classificacao"
}

IMPORTANTE:
- NCM: 8 digitos no formato 0000.00.00
- CEST: 7 digitos no formato 00.000.00
- CST: exatamente 3 digitos
- cClassTrib: exatamente 3 digitos
- confianca: retorne 100 quando o produto tem classificacao clara e nao ambigua na tabela TIPI. Retorne entre 85 e 99 apenas quando houver genuina ambiguidade entre dois ou mais NCMs possiveis. NUNCA retorne abaixo de 85. Se nao souber classificar com total certeza, prefira o NCM mais proximo com confianca 85. Para produtos comuns e bem descritos, sempre retorne 100.
- Responda APENAS o JSON, sem markdown, sem texto adicional
`;

  return {
    model: GROQ_MODEL,
    temperature: 0.0,
    max_tokens: 600,
    messages: [
      {
        role: 'system',
        content:
          'Voce e um perito em legislacao tributaria brasileira. Responda SEMPRE apenas com JSON valido e preciso, sem texto adicional, sem markdown e sem explicacoes fora do JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]
  };
}

export function parseGroqResponse(data: GroqResponse): ClassificacaoResult {
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error('A Groq retornou uma resposta vazia');
  }

  const result = JSON.parse(extractJsonPayload(content));

  return normalizeResult(result);
}
