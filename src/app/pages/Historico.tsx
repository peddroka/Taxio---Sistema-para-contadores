import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  MessageSquare,
  Search,
  Star,
  Trash2
} from 'lucide-react';
import { TaxioBadge } from '../components/taxio/TaxioBadge';
import { TaxioButton } from '../components/taxio/TaxioButton';
import { TaxioCard } from '../components/taxio/TaxioCard';
import { TaxioInput } from '../components/taxio/TaxioInput';
import { getEmpresaAtiva, listarEmpresas } from '../../services/empresas';
import { TAXIO_DATA_EVENT } from '../../services/events';
import { listarFavoritos, toggleFavorito } from '../../services/favoritos';
import { downloadCSV, gerarCSVPorERP } from '../../services/exportar';
import {
  ClassificacaoSalva,
  atualizarComentario,
  deletarClassificacao,
  listarClassificacoes
} from '../../services/storage';

const filters = ['Todos', 'Aprovados', 'Revisar', 'IA', 'Lote', 'Manual'];
const pageSize = 8;

function getOrigemBadge(origem: ClassificacaoSalva['origem']) {
  const variants = {
    ia: 'info',
    lote: 'lote',
    manual: 'success'
  } as const;

  return variants[origem] || 'lote';
}

function getStatusBadge(status: ClassificacaoSalva['status']) {
  return status === 'aprovado' ? 'success' : 'warning';
}

function matchesFilter(item: ClassificacaoSalva, filter: string) {
  if (filter === 'Todos') {
    return true;
  }

  if (filter === 'Aprovados') {
    return item.status === 'aprovado';
  }

  if (filter === 'Revisar') {
    return item.status === 'revisar';
  }

  return item.origem === filter.toLowerCase();
}

function buildPagination(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | string> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    pages.push('...');
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push('...');
  }

  pages.push(totalPages);

  return pages;
}

export default function Historico() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<ClassificacaoSalva[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState('todas');
  const [companies, setCompanies] = useState(() => listarEmpresas());
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');

  useEffect(() => {
    const syncData = () => {
      const activeCompany = getEmpresaAtiva();

      setItems(listarClassificacoes());
      setFavoriteIds(listarFavoritos().map((item) => item.id));
      setCompanies(listarEmpresas());
      setActiveCompanyId(activeCompany?.id || 'todas');
    };

    syncData();
    window.addEventListener(TAXIO_DATA_EVENT, syncData as EventListener);

    return () => window.removeEventListener(TAXIO_DATA_EVENT, syncData as EventListener);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter, activeCompanyId]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.produto.toLowerCase().includes(query) ||
        item.ncm.toLowerCase().includes(query) ||
        item.cest.toLowerCase().includes(query) ||
        item.cst.toLowerCase().includes(query) ||
        item.cClassTrib.toLowerCase().includes(query) ||
        item.observacoes.toLowerCase().includes(query) ||
        item.comentario?.toLowerCase().includes(query);
      const matchesCompany = activeCompanyId === 'todas' ? true : item.empresaId === activeCompanyId;

      return matchesSearch && matchesCompany && matchesFilter(item, activeFilter);
    });
  }, [activeCompanyId, activeFilter, items, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedItems = filteredItems.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );
  const paginationItems = buildPagination(safeCurrentPage, totalPages);

  function handleDelete(id: string) {
    deletarClassificacao(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function handleDownload(item: ClassificacaoSalva) {
    const csv = gerarCSVPorERP(
      [
        {
          codigo: item.codigo || '',
          descricao: item.produto,
          ncm: item.ncm,
          cest: item.cest,
          cst: item.cst,
          cClassTrib: item.cClassTrib
        }
      ],
      'generico'
    );

    downloadCSV(csv, `taxio_historico_${item.id}.csv`);
  }

  function handleToggleFavorito(item: ClassificacaoSalva) {
    toggleFavorito(item);
    setFavoriteIds(listarFavoritos().map((favorito) => favorito.id));
  }

  function handleDuplicate(item: ClassificacaoSalva) {
    navigate('/consulta-ia', {
      state: {
        descricao: item.produto,
        erp: item.erp,
        uf: item.uf,
        regime: item.regime,
        resultadoAnterior: item
      }
    });
  }

  function openCommentEditor(item: ClassificacaoSalva) {
    setEditingCommentId(item.id);
    setCommentDraft(item.comentario || '');
  }

  function saveComment(id: string) {
    atualizarComentario(id, commentDraft.trim());
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, comentario: commentDraft.trim() } : item))
    );
    setEditingCommentId(null);
    setCommentDraft('');
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Historico
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Todas as classificacoes realizadas
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <TaxioInput
          placeholder="Buscar por produto, NCM, CEST, observacoes ou comentario..."
          icon={<Search className="w-4 h-4" />}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="flex-1"
        />
        <TaxioButton
          variant="outline"
          onClick={() => {
            setSearchTerm('');
            setActiveFilter('Todos');
            setActiveCompanyId(getEmpresaAtiva()?.id || 'todas');
          }}
          disabled={!searchTerm && activeFilter === 'Todos'}
        >
          Limpar filtros
        </TaxioButton>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className="px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all"
            style={{
              backgroundColor: activeFilter === filter ? 'var(--accent-royal)' : 'var(--bg-surface)',
              color: activeFilter === filter ? '#FFFFFF' : 'var(--text-secondary)',
              border: `1px solid ${activeFilter === filter ? 'transparent' : 'var(--border)'}`
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {!!companies.length && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCompanyId('todas')}
            className="px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all"
            style={{
              backgroundColor: activeCompanyId === 'todas' ? 'var(--accent-royal)' : 'var(--bg-surface)',
              color: activeCompanyId === 'todas' ? '#FFFFFF' : 'var(--text-secondary)',
              border: `1px solid ${activeCompanyId === 'todas' ? 'transparent' : 'var(--border)'}`
            }}
          >
            Todas as empresas
          </button>
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => setActiveCompanyId(company.id)}
              className="px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all"
              style={{
                backgroundColor: activeCompanyId === company.id ? company.cor : 'var(--bg-surface)',
                color: activeCompanyId === company.id ? '#FFFFFF' : 'var(--text-secondary)',
                border: `1px solid ${activeCompanyId === company.id ? 'transparent' : 'var(--border)'}`
              }}
            >
              {company.razaoSocial}
            </button>
          ))}
        </div>
      )}

      {!filteredItems.length && (
        <TaxioCard>
          <div className="py-10 text-center">
            <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Nenhuma classificacao encontrada
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Assim que voce salvar classificacoes por IA, lote ou manual, elas vao aparecer aqui.
            </p>
          </div>
        </TaxioCard>
      )}

      {!!filteredItems.length && (
        <>
          <div className="hidden md:block">
            <TaxioCard>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                        Produto
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                        NCM
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                        CEST
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                        CST
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                        Origem
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                        Data
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                        Status
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item) => {
                      const favorito = favoriteIds.includes(item.id);
                      const editing = editingCommentId === item.id;

                      return (
                        <tr
                          key={item.id}
                          className="group transition-colors"
                          style={{ borderBottom: '1px solid var(--border)' }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <td className="py-3 px-4 align-top">
                            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                              {item.produto}
                            </span>
                            {item.empresaNome && (
                              <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                {item.empresaNome}
                              </div>
                            )}
                            {editing && (
                              <textarea
                                autoFocus
                                value={commentDraft}
                                rows={3}
                                onChange={(event) => setCommentDraft(event.target.value)}
                                onBlur={() => saveComment(item.id)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault();
                                    saveComment(item.id);
                                  }
                                }}
                                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                                style={{
                                  backgroundColor: 'var(--bg-surface)',
                                  borderColor: 'var(--border)',
                                  color: 'var(--text-primary)'
                                }}
                              />
                            )}
                            {!editing && item.comentario && (
                              <div className="text-xs mt-2" style={{ color: 'var(--info)' }}>
                                {item.comentario}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 align-top">
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {item.ncm}
                            </span>
                          </td>
                          <td className="py-3 px-4 align-top">
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {item.cest || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 align-top">
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {item.cst}
                            </span>
                          </td>
                          <td className="py-3 px-4 align-top">
                            <TaxioBadge variant={getOrigemBadge(item.origem)}>
                              {item.origem.toUpperCase()}
                            </TaxioBadge>
                          </td>
                          <td className="py-3 px-4 align-top">
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {item.data}
                            </span>
                          </td>
                          <td className="py-3 px-4 align-top">
                            <TaxioBadge variant={getStatusBadge(item.status)}>
                              {item.status === 'aprovado' ? 'Aprovado' : 'Revisar'}
                            </TaxioBadge>
                          </td>
                          <td className="py-3 px-4 align-top">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: favorito ? 'var(--warning)' : 'var(--text-secondary)' }}
                                onClick={() => handleToggleFavorito(item)}
                                title={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                              >
                                <Star className="w-4 h-4" fill={favorito ? 'currentColor' : 'none'} />
                              </button>
                              <button
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: item.comentario ? 'var(--info)' : 'var(--text-secondary)' }}
                                onClick={() => openCommentEditor(item)}
                                title={item.comentario || 'Adicionar comentario'}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              <button
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: 'var(--accent-light)' }}
                                onClick={() => handleDuplicate(item)}
                                title="Duplicar classificacao"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: 'var(--accent-light)' }}
                                onClick={() => handleDownload(item)}
                                title="Baixar registro"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: 'var(--danger)' }}
                                onClick={() => handleDelete(item.id)}
                                title="Excluir registro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TaxioCard>
          </div>

          <div className="md:hidden space-y-3">
            {paginatedItems.map((item) => {
              const favorito = favoriteIds.includes(item.id);
              const editing = editingCommentId === item.id;

              return (
                <TaxioCard key={item.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                        {item.produto}
                      </h4>
                      <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        NCM: {item.ncm} • {item.data}
                      </p>
                      {item.empresaNome && (
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {item.empresaNome}
                        </p>
                      )}
                    </div>
                    <TaxioBadge variant={getStatusBadge(item.status)}>
                      {item.status === 'aprovado' ? 'Aprovado' : 'Revisar'}
                    </TaxioBadge>
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <TaxioBadge variant={getOrigemBadge(item.origem)}>
                      {item.origem.toUpperCase()}
                    </TaxioBadge>
                    <div className="flex gap-2">
                      <button
                        className="p-2 rounded-lg"
                        style={{ color: favorito ? 'var(--warning)' : 'var(--text-secondary)' }}
                        onClick={() => handleToggleFavorito(item)}
                      >
                        <Star className="w-4 h-4" fill={favorito ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        className="p-2 rounded-lg"
                        style={{ color: item.comentario ? 'var(--info)' : 'var(--text-secondary)' }}
                        onClick={() => openCommentEditor(item)}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 rounded-lg"
                        style={{ color: 'var(--accent-light)' }}
                        onClick={() => handleDuplicate(item)}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 rounded-lg"
                        style={{ color: 'var(--accent-light)' }}
                        onClick={() => handleDownload(item)}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 rounded-lg"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {editing && (
                    <textarea
                      autoFocus
                      value={commentDraft}
                      rows={3}
                      onChange={(event) => setCommentDraft(event.target.value)}
                      onBlur={() => saveComment(item.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          saveComment(item.id);
                        }
                      }}
                      className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  )}
                  {!editing && item.comentario && (
                    <p className="text-xs mt-3" style={{ color: 'var(--info)' }}>
                      {item.comentario}
                    </p>
                  )}
                </TaxioCard>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-surface)'
              }}
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <div className="flex items-center gap-2">
              {paginationItems.map((page, index) => (
                <button
                  key={`${page}-${index}`}
                  onClick={() => typeof page === 'number' && setCurrentPage(page)}
                  className="w-10 h-10 rounded-lg font-semibold text-sm transition-colors"
                  style={{
                    backgroundColor: safeCurrentPage === page ? 'var(--accent-royal)' : 'var(--bg-surface)',
                    color: safeCurrentPage === page ? '#FFFFFF' : 'var(--text-secondary)'
                  }}
                  disabled={typeof page !== 'number'}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-surface)'
              }}
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              <span className="hidden sm:inline">Proxima</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
