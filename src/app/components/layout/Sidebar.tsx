import { Link, useLocation } from 'react-router';
import {
  Building2,
  Download,
  FileBarChart,
  FileStack,
  History,
  LayoutDashboard,
  LifeBuoy,
  PenLine,
  Plug,
  Sparkles,
  Star
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { TaxioLogo } from '../taxio/TaxioLogo';
import { getEmpresaAtiva, listarEmpresas, setEmpresaAtiva } from '../../../services/empresas';
import { TAXIO_DATA_EVENT } from '../../../services/events';

const navigation = [
  {
    section: 'PRINCIPAL',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
      { name: 'Empresas', icon: Building2, href: '/empresas' }
    ]
  },
  {
    section: 'CONSULTAS',
    items: [
      { name: 'Consulta com IA', icon: Sparkles, href: '/consulta-ia' },
      { name: 'Consulta em Lote', icon: FileStack, href: '/consulta-lote' },
      { name: 'Consulta Manual', icon: PenLine, href: '/consulta-manual' }
    ]
  },
  {
    section: 'SAIDA',
    items: [
      { name: 'Historico', icon: History, href: '/historico' },
      { name: 'Favoritos', icon: Star, href: '/favoritos' },
      { name: 'Exportar CSV', icon: Download, href: '/exportar' },
      { name: 'Relatorios', icon: FileBarChart, href: '/relatorios' }
    ]
  },
  {
    section: 'AVANCADO',
    items: [{ name: 'Integracoes', icon: Plug, href: '/integracoes' }]
  },
  {
    section: 'AJUDA',
    items: [{ name: 'Central de Ajuda', icon: LifeBuoy, href: '/ajuda' }]
  }
];

export function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCompanies, setShowCompanies] = useState(false);
  const [empresas, setEmpresas] = useState(() => listarEmpresas());
  const [empresaAtiva, setEmpresa] = useState(() => getEmpresaAtiva());

  useEffect(() => {
    const syncData = () => {
      setEmpresas(listarEmpresas());
      setEmpresa(getEmpresaAtiva());
    };

    syncData();
    window.addEventListener(TAXIO_DATA_EVENT, syncData as EventListener);

    return () => window.removeEventListener(TAXIO_DATA_EVENT, syncData as EventListener);
  }, []);

  return (
    <aside
      className={`hidden sm:flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-56 lg:w-72'
      }`}
      style={{ backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-3 px-5 py-6 border-b" style={{ borderColor: 'var(--border)' }}>
        {isCollapsed ? (
          <TaxioLogo size="sm" showText={false} />
        ) : (
          <TaxioLogo size="md" showText={true} showTagline={true} />
        )}
      </div>

      {!isCollapsed && (
        <div className="px-4 py-4 border-b relative" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setShowCompanies((current) => !current)}
            className="w-full flex items-center justify-between gap-3 rounded-xl px-3 py-3"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: empresaAtiva?.cor || 'var(--text-muted)' }}
              />
              <div className="min-w-0 text-left">
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Empresa ativa
                </div>
                <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                  {empresaAtiva?.razaoSocial || 'Nenhuma empresa'}
                </div>
              </div>
            </div>
            <svg
              className={`w-4 h-4 transition-transform ${showCompanies ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: 'var(--text-secondary)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showCompanies && (
            <div
              className="absolute left-4 right-4 top-[calc(100%-8px)] rounded-xl border p-2 z-20"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              {empresas.map((empresa) => (
                <button
                  key={empresa.id}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left"
                  style={{
                    backgroundColor: empresa.id === empresaAtiva?.id ? 'var(--bg-elevated)' : 'transparent'
                  }}
                  onClick={() => {
                    setEmpresaAtiva(empresa.id);
                    setShowCompanies(false);
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: empresa.cor }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {empresa.razaoSocial}
                  </span>
                </button>
              ))}
              {!empresas.length && (
                <Link
                  to="/empresas"
                  className="block px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ color: 'var(--accent-light)' }}
                >
                  Cadastrar primeira empresa
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navigation.map((group) => (
          <div key={group.section} className="mb-6">
            {!isCollapsed && (
              <div
                className="px-3 mb-2 text-[10px] tracking-wider font-semibold uppercase"
                style={{ color: 'var(--text-muted)' }}
              >
                {group.section}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative ${
                      isActive ? 'translate-y-0' : 'hover:-translate-y-0.5'
                    }`}
                    style={{
                      backgroundColor: isActive ? 'var(--accent-royal)' : 'transparent',
                      color: isActive ? '#FFFFFF' : 'var(--text-secondary)'
                    }}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="font-semibold text-sm">{item.name}</span>}
                    {!isActive && (
                      <div
                        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity -z-10"
                        style={{ backgroundColor: 'var(--bg-elevated)' }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {!isCollapsed && (
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ backgroundColor: 'var(--accent-royal)', color: '#FFFFFF' }}
            >
              MC
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                Maria Contador
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Workspace fiscal
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden sm:flex md:flex items-center justify-center p-2 border-t transition-colors"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text-secondary)'
        }}
        title={isCollapsed ? 'Expandir' : 'Recolher'}
      >
        <svg
          className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
    </aside>
  );
}
