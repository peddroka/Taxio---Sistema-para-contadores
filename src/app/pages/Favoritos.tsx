import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Copy, Download, Star } from 'lucide-react';
import { TaxioBadge } from '../components/taxio/TaxioBadge';
import { TaxioButton } from '../components/taxio/TaxioButton';
import { TaxioCard } from '../components/taxio/TaxioCard';
import { TaxioSelect } from '../components/taxio/TaxioSelect';
import { TAXIO_DATA_EVENT } from '../../services/events';
import { listarFavoritos, removerFavorito } from '../../services/favoritos';
import { downloadCSV, gerarCSVPorERP } from '../../services/exportar';
import { ClassificacaoSalva, listarClassificacoes } from '../../services/storage';

function getOrigemBadge(origem: ClassificacaoSalva['origem']) {
  const variants = {
    ia: 'info',
    lote: 'lote',
    manual: 'success'
  } as const;

  return variants[origem] || 'lote';
}

export default function Favoritos() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ClassificacaoSalva[]>([]);
  const [erpFiltro, setErpFiltro] = useState('');
  const [ufFiltro, setUfFiltro] = useState('');
  const [regimeFiltro, setRegimeFiltro] = useState('');

  useEffect(() => {
    const syncData = () => {
      const favoritos = listarFavoritos();
      const atuais = listarClassificacoes();
      const atualizados = favoritos.map((item) => atuais.find((atual) => atual.id === item.id) || item);

      setItems(atualizados);
    };

    syncData();
    window.addEventListener(TAXIO_DATA_EVENT, syncData as EventListener);

    return () => window.removeEventListener(TAXIO_DATA_EVENT, syncData as EventListener);
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesERP = !erpFiltro || item.erp === erpFiltro;
      const matchesUF = !ufFiltro || item.uf === ufFiltro;
      const matchesRegime = !regimeFiltro || item.regime === regimeFiltro;

      return matchesERP && matchesUF && matchesRegime;
    });
  }, [erpFiltro, items, regimeFiltro, ufFiltro]);

  const erpOptions = [
    { value: '', label: 'Todos os ERPs' },
    ...Array.from(new Set(items.map((item) => item.erp).filter(Boolean))).map((erp) => ({
      value: erp,
      label: erp.toUpperCase()
    }))
  ];
  const ufOptions = [
    { value: '', label: 'Todas as UFs' },
    ...Array.from(new Set(items.map((item) => item.uf).filter(Boolean))).map((uf) => ({
      value: uf,
      label: uf
    }))
  ];
  const regimeOptions = [
    { value: '', label: 'Todos os regimes' },
    ...Array.from(new Set(items.map((item) => item.regime).filter(Boolean))).map((regime) => ({
      value: regime,
      label: regime.replace(/_/g, ' ')
    }))
  ];

  function handleUseThis(item: ClassificacaoSalva) {
    navigate('/consulta-ia', {
      state: {
        descricao: item.produto,
        erp: item.erp,
        uf: item.uf,
        regime: item.regime
      }
    });
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

  function handleRemove(item: ClassificacaoSalva) {
    removerFavorito(item.id);
    setItems((current) => current.filter((favorite) => favorite.id !== item.id));
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

    downloadCSV(csv, `taxio_favorito_${item.id}.csv`);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Star className="w-5 h-5" style={{ color: 'var(--warning)' }} />
          <h1 className="font-bold" style={{ color: 'var(--text-primary)' }}>
            Favoritos
          </h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Reaproveite classificacoes recorrentes com um clique
        </p>
      </div>

      <TaxioCard>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TaxioSelect label="Por ERP" options={erpOptions} value={erpFiltro} onChange={(event) => setErpFiltro(event.target.value)} />
          <TaxioSelect label="Por UF" options={ufOptions} value={ufFiltro} onChange={(event) => setUfFiltro(event.target.value)} />
          <TaxioSelect
            label="Por Regime"
            options={regimeOptions}
            value={regimeFiltro}
            onChange={(event) => setRegimeFiltro(event.target.value)}
          />
        </div>
      </TaxioCard>

      <div className="space-y-4 mt-6">
        {filteredItems.map((item) => (
          <TaxioCard key={item.id}>
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {item.produto}
                  </h3>
                  <TaxioBadge variant={getOrigemBadge(item.origem)}>{item.origem.toUpperCase()}</TaxioBadge>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  NCM {item.ncm} • CEST {item.cest || '-'} • CST {item.cst} • {item.regime.replace(/_/g, ' ')}
                </p>
                {item.empresaNome && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {item.empresaNome}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <TaxioButton variant="outline" onClick={() => handleUseThis(item)}>
                  Usar este
                </TaxioButton>
                <TaxioButton variant="outline" icon={<Copy className="w-4 h-4" />} onClick={() => handleDuplicate(item)}>
                  Duplicar
                </TaxioButton>
                <TaxioButton variant="outline" icon={<Download className="w-4 h-4" />} onClick={() => handleDownload(item)}>
                  Baixar
                </TaxioButton>
                <button
                  className="px-4 py-2.5 rounded-xl font-semibold text-sm"
                  style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}
                  onClick={() => handleRemove(item)}
                >
                  <span className="inline-flex items-center gap-2">
                    <Star className="w-4 h-4" fill="currentColor" />
                    Desfavoritar
                  </span>
                </button>
              </div>
            </div>
          </TaxioCard>
        ))}
      </div>

      {!filteredItems.length && (
        <TaxioCard className="mt-6">
          <div className="py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Nenhum favorito salvo com os filtros atuais.
          </div>
        </TaxioCard>
      )}
    </div>
  );
}
