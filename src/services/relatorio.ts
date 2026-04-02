import { Empresa } from './empresas';
import { ClassificacaoSalva } from './storage';
import { emitTaxioDataUpdated } from './events';

export interface DadosRelatorio {
  empresa: Empresa | null;
  mes: string;
  periodo?: string;
  totalClassificados: number;
  totalAprovados: number;
  totalRevisar: number;
  acuraciaMedia: number;
  porOrigem: {
    ia: number;
    lote: number;
    manual: number;
  };
  classificacoes: ClassificacaoSalva[];
}

export interface RelatorioGerado {
  id: string;
  mes: string;
  periodo?: string;
  empresaId?: string;
  empresaNome?: string;
  formato: 'html' | 'pdf';
  criadoEm: string;
  totalClassificados: number;
}

const RELATORIOS_KEY = 'taxio_relatorios_gerados';

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `rel-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function registrarRelatorio(dados: DadosRelatorio, formato: 'html' | 'pdf') {
  if (typeof window === 'undefined') {
    return;
  }

  const historico = listarRelatoriosGerados();

  historico.unshift({
    id: generateId(),
    mes: dados.mes,
    periodo: dados.periodo,
    empresaId: dados.empresa?.id,
    empresaNome: dados.empresa?.razaoSocial,
    formato,
    criadoEm: new Date().toISOString(),
    totalClassificados: dados.totalClassificados
  });

  localStorage.setItem(RELATORIOS_KEY, JSON.stringify(historico.slice(0, 12)));
  emitTaxioDataUpdated('relatorios');
}

export function listarRelatoriosGerados(): RelatorioGerado[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    return JSON.parse(localStorage.getItem(RELATORIOS_KEY) || '[]') as RelatorioGerado[];
  } catch {
    return [];
  }
}

export function gerarHTMLRelatorio(dados: DadosRelatorio): string {
  const { empresa, mes, totalClassificados, totalAprovados, totalRevisar, acuraciaMedia, porOrigem } =
    dados;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #1a1a1a; padding: 40px; background: white; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #1A4ED8; }
    .logo { font-size: 24px; font-weight: 800; color: #1A4ED8; }
    .logo span { color: #0F1A2E; }
    .titulo { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    .subtitulo { font-size: 13px; color: #666; }
    .metricas { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }
    .metrica { background: #F8FAFF; border: 1px solid #E0E7FF; border-radius: 8px; padding: 16px; text-align: center; }
    .metrica-valor { font-size: 28px; font-weight: 800; color: #1A4ED8; }
    .metrica-label { font-size: 12px; color: #666; margin-top: 4px; }
    .resumo { display: flex; gap: 12px; margin-bottom: 24px; font-size: 12px; color: #334155; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #0F1A2E; color: white; padding: 10px 8px; text-align: left; font-weight: 600; }
    td { padding: 8px; border-bottom: 1px solid #E5E7EB; vertical-align: top; }
    tr:nth-child(even) td { background: #F9FAFB; }
    .badge-ok { background: #D1FAE5; color: #065F46; padding: 2px 8px; border-radius: 99px; }
    .badge-rev { background: #FEF3C7; color: #92400E; padding: 2px 8px; border-radius: 99px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Tax<span>io</span></div>
      <div style="font-size:11px;color:#999;margin-top:2px;">Classificacao Fiscal com IA</div>
    </div>
    <div style="text-align:right">
      <div class="titulo">Relatorio de Classificacoes</div>
      <div class="subtitulo">${escapeHtml(mes)}</div>
      ${empresa ? `<div class="subtitulo">${escapeHtml(empresa.razaoSocial)} — ${escapeHtml(empresa.cnpj)}</div>` : ''}
    </div>
  </div>

  <div class="metricas">
    <div class="metrica">
      <div class="metrica-valor">${totalClassificados}</div>
      <div class="metrica-label">Total classificados</div>
    </div>
    <div class="metrica">
      <div class="metrica-valor">${totalAprovados}</div>
      <div class="metrica-label">Aprovados</div>
    </div>
    <div class="metrica">
      <div class="metrica-valor">${totalRevisar}</div>
      <div class="metrica-label">Para revisar</div>
    </div>
    <div class="metrica">
      <div class="metrica-valor">${acuraciaMedia}%</div>
      <div class="metrica-label">Acuracia media</div>
    </div>
  </div>

  <div class="resumo">
    <div>IA: ${porOrigem.ia}</div>
    <div>Lote: ${porOrigem.lote}</div>
    <div>Manual: ${porOrigem.manual}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Produto</th>
        <th>NCM</th>
        <th>CEST</th>
        <th>CST</th>
        <th>cClassTrib</th>
        <th>Origem</th>
        <th>Data</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${dados.classificacoes
        .map(
          (classificacao) => `
        <tr>
          <td>${escapeHtml(classificacao.produto)}</td>
          <td>${escapeHtml(classificacao.ncm)}</td>
          <td>${escapeHtml(classificacao.cest)}</td>
          <td>${escapeHtml(classificacao.cst)}</td>
          <td>${escapeHtml(classificacao.cClassTrib)}</td>
          <td>${escapeHtml(classificacao.origem.toUpperCase())}</td>
          <td>${escapeHtml(classificacao.data)}</td>
          <td>
            <span class="${classificacao.status === 'aprovado' ? 'badge-ok' : 'badge-rev'}">
              ${classificacao.status === 'aprovado' ? 'Aprovado' : 'Revisar'}
            </span>
          </td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="footer">
    Relatorio gerado automaticamente pelo Taxio em
    ${new Date().toLocaleDateString('pt-BR')} as
    ${new Date().toLocaleTimeString('pt-BR')} •
    Classificacao Fiscal com IA
  </div>
</body>
</html>
`;
}

export function baixarRelatorioHTML(dados: DadosRelatorio): void {
  const html = gerarHTMLRelatorio(dados);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = `taxio_relatorio_${dados.mes.replace(/\s+/g, '_')}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
  registrarRelatorio(dados, 'html');
}

export function imprimirRelatorio(dados: DadosRelatorio): void {
  const html = gerarHTMLRelatorio(dados);
  const win = window.open('', '_blank');

  if (!win) {
    return;
  }

  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
  registrarRelatorio(dados, 'pdf');
}
