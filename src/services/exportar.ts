export type ERPType = 'totvs' | 'sap' | 'omie' | 'bling' | 'generico';

export interface ItemExportacao {
  codigo: string;
  descricao: string;
  ncm: string;
  cest: string;
  cst: string;
  cClassTrib: string;
}

function sanitizeValue(value: string) {
  return value.replace(/\r?\n/g, ' ').trim();
}

function escapeCSVValue(value: string, separator: ',' | ';') {
  const safeValue = sanitizeValue(value);

  if (safeValue.includes('"')) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }

  if (safeValue.includes(separator)) {
    return `"${safeValue}"`;
  }

  return safeValue;
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export function gerarCSVPorERP(itens: ItemExportacao[], erp: ERPType): string {
  if (erp === 'totvs') {
    const header = 'B1_COD;B1_DESC;B1_POSIPI;B1_CEST;B5_CST;B5_CLASFIS';
    const linhas = itens.map((item) =>
      [
        escapeCSVValue(item.codigo, ';'),
        escapeCSVValue(item.descricao, ';'),
        digitsOnly(item.ncm),
        digitsOnly(item.cest),
        item.cst,
        item.cClassTrib
      ].join(';')
    );

    return [header, ...linhas].join('\n');
  }

  if (erp === 'sap') {
    const header = 'ItemCode,ItemName,NCMCode,CSTCode,CESTCode,ClassTrib';
    const linhas = itens.map((item) =>
      [
        escapeCSVValue(item.codigo, ','),
        escapeCSVValue(item.descricao, ','),
        digitsOnly(item.ncm),
        item.cst,
        digitsOnly(item.cest),
        item.cClassTrib
      ].join(',')
    );

    return [header, ...linhas].join('\n');
  }

  if (erp === 'omie') {
    const header = 'codigo;descricao;ncm;cest;cst;classtrib';
    const linhas = itens.map((item) =>
      [
        escapeCSVValue(item.codigo, ';'),
        escapeCSVValue(item.descricao, ';'),
        item.ncm,
        item.cest,
        item.cst,
        item.cClassTrib
      ].join(';')
    );

    return [header, ...linhas].join('\n');
  }

  if (erp === 'bling') {
    const header = 'Codigo,Descricao,NCM,CEST,CST,ClassTrib';
    const linhas = itens.map((item) =>
      [
        escapeCSVValue(item.codigo, ','),
        escapeCSVValue(item.descricao, ','),
        item.ncm,
        item.cest,
        item.cst,
        item.cClassTrib
      ].join(',')
    );

    return [header, ...linhas].join('\n');
  }

  const header = 'codigo,descricao,ncm,cest,cst,cClassTrib';
  const linhas = itens.map((item) =>
    [
      escapeCSVValue(item.codigo, ','),
      escapeCSVValue(item.descricao, ','),
      item.ncm,
      item.cest,
      item.cst,
      item.cClassTrib
    ].join(',')
  );

  return [header, ...linhas].join('\n');
}

export function downloadCSV(conteudo: string, nomeArquivo: string) {
  const blob = new Blob([`\uFEFF${conteudo}`], {
    type: 'text/csv;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = nomeArquivo;
  anchor.click();

  URL.revokeObjectURL(url);
}
