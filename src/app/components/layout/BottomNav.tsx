import { Link, useLocation } from 'react-router';
import {
  Building2,
  Download,
  FileBarChart,
  FileStack,
  History,
  LayoutDashboard,
  LifeBuoy,
  MoreHorizontal,
  Plug,
  Sparkles,
  Star
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'Consulta IA', icon: Sparkles, href: '/consulta-ia' },
  { name: 'Lote', icon: FileStack, href: '/consulta-lote' },
  { name: 'Historico', icon: History, href: '/historico' },
  { name: 'Mais', icon: MoreHorizontal, href: '#' }
];

const moreItems = [
  { name: 'Favoritos', icon: Star, href: '/favoritos' },
  { name: 'Empresas', icon: Building2, href: '/empresas' },
  { name: 'Relatorios', icon: FileBarChart, href: '/relatorios' },
  { name: 'Exportar', icon: Download, href: '/exportar' },
  { name: 'Integracoes', icon: Plug, href: '/integracoes' },
  { name: 'Ajuda', icon: LifeBuoy, href: '/ajuda' }
];

export function BottomNav() {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 border-t z-50"
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            const isMais = item.name === 'Mais';

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={(event) => {
                  if (isMais) {
                    event.preventDefault();
                    setShowMore(!showMore);
                  }
                }}
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors min-w-[60px]"
                style={{
                  color: isActive ? 'var(--accent-royal)' : 'var(--text-secondary)'
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {showMore && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={() => setShowMore(false)} />
          <div
            className="fixed bottom-0 left-0 right-0 rounded-t-2xl p-6 z-50 sm:hidden animate-in slide-in-from-bottom"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <div className="w-12 h-1 rounded-full mx-auto mb-6" style={{ backgroundColor: 'var(--border-hover)' }} />
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Menu
            </h3>
            <div className="space-y-2">
              {moreItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                    onClick={() => setShowMore(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
