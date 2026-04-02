import { createBrowserRouter } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import ConsultaIA from './pages/ConsultaIA';
import ConsultaLote from './pages/ConsultaLote';
import ConsultaManual from './pages/ConsultaManual';
import Historico from './pages/Historico';
import ExportarCSV from './pages/ExportarCSV';
import CentralAjuda from './pages/CentralAjuda';
import Favoritos from './pages/Favoritos';
import Empresas from './pages/Empresas';
import Relatorios from './pages/Relatorios';
import Integracoes from './pages/Integracoes';

function withShell(PageComponent: () => JSX.Element) {
  return function WrappedRoute() {
    return (
      <AppShell>
        <PageComponent />
      </AppShell>
    );
  };
}

const Root = withShell(Dashboard);
const ConsultaIARoute = withShell(ConsultaIA);
const ConsultaLoteRoute = withShell(ConsultaLote);
const ConsultaManualRoute = withShell(ConsultaManual);
const HistoricoRoute = withShell(Historico);
const FavoritosRoute = withShell(Favoritos);
const EmpresasRoute = withShell(Empresas);
const ExportarRoute = withShell(ExportarCSV);
const RelatoriosRoute = withShell(Relatorios);
const IntegracoesRoute = withShell(Integracoes);
const AjudaRoute = withShell(CentralAjuda);

function NotFound() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-6xl font-extrabold mb-4" style={{ color: 'var(--text-primary)' }}>
          404
        </h1>
        <p className="text-xl mb-2" style={{ color: 'var(--text-secondary)' }}>
          Pagina nao encontrada
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          A pagina que voce esta procurando nao existe.
        </p>
        <a
          href="/"
          className="px-6 py-3 rounded-xl font-semibold text-sm"
          style={{ backgroundColor: 'var(--accent-royal)', color: '#FFFFFF' }}
        >
          Voltar ao Dashboard
        </a>
      </div>
    </AppShell>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root
  },
  {
    path: '/consulta-ia',
    Component: ConsultaIARoute
  },
  {
    path: '/consulta-lote',
    Component: ConsultaLoteRoute
  },
  {
    path: '/consulta-manual',
    Component: ConsultaManualRoute
  },
  {
    path: '/historico',
    Component: HistoricoRoute
  },
  {
    path: '/favoritos',
    Component: FavoritosRoute
  },
  {
    path: '/empresas',
    Component: EmpresasRoute
  },
  {
    path: '/exportar',
    Component: ExportarRoute
  },
  {
    path: '/relatorios',
    Component: RelatoriosRoute
  },
  {
    path: '/integracoes',
    Component: IntegracoesRoute
  },
  {
    path: '/ajuda',
    Component: AjudaRoute
  },
  {
    path: '*',
    Component: NotFound
  }
]);
