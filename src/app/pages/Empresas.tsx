import { useEffect, useState } from 'react';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { TaxioButton } from '../components/taxio/TaxioButton';
import { TaxioCard } from '../components/taxio/TaxioCard';
import { TaxioInput } from '../components/taxio/TaxioInput';
import { TaxioSelect } from '../components/taxio/TaxioSelect';
import { empresaColors, erpOptions, regimeOptions, ufOptions } from '../../services/catalogos';
import {
  Empresa,
  aplicarMascaraCNPJ,
  atualizarEmpresa,
  criarEmpresa,
  deletarEmpresa,
  formatarCNPJ,
  listarEmpresas,
  setEmpresaAtiva
} from '../../services/empresas';

const emptyForm = {
  cnpj: '',
  razaoSocial: '',
  regime: 'lucro_presumido',
  erp: '',
  uf: '',
  cor: empresaColors[0],
  ativa: true
};

export default function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    setEmpresas(listarEmpresas());
  }, []);

  function openCreateModal() {
    setEditingEmpresa(null);
    setFormData({
      ...emptyForm,
      ativa: empresas.length === 0
    });
    setOpenModal(true);
  }

  function openEditModal(empresa: Empresa) {
    setEditingEmpresa(empresa);
    setFormData({
      cnpj: empresa.cnpj,
      razaoSocial: empresa.razaoSocial,
      regime: empresa.regime,
      erp: empresa.erp,
      uf: empresa.uf,
      cor: empresa.cor,
      ativa: empresa.ativa
    });
    setOpenModal(true);
  }

  function handleSave() {
    if (!formData.cnpj || !formData.razaoSocial || !formData.erp || !formData.uf) {
      return;
    }

    const deveAtivar = editingEmpresa ? formData.ativa : empresas.length === 0 ? true : formData.ativa;

    if (editingEmpresa) {
      atualizarEmpresa(editingEmpresa.id, {
        cnpj: formData.cnpj,
        razaoSocial: formData.razaoSocial,
        regime: formData.regime as Empresa['regime'],
        erp: formData.erp,
        uf: formData.uf,
        cor: formData.cor,
        ativa: deveAtivar
      });
    } else {
      criarEmpresa({
        cnpj: formData.cnpj,
        razaoSocial: formData.razaoSocial,
        regime: formData.regime as Empresa['regime'],
        erp: formData.erp,
        uf: formData.uf,
        cor: formData.cor,
        ativa: deveAtivar
      });
    }

    setEmpresas(listarEmpresas());
    setOpenModal(false);
  }

  function handleDelete(id: string) {
    deletarEmpresa(id);
    setEmpresas(listarEmpresas());
  }

  function handleActivate(id: string) {
    setEmpresaAtiva(id);
    setEmpresas(listarEmpresas());
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Building2 className="w-5 h-5" style={{ color: 'var(--accent-light)' }} />
            <h1 className="font-bold" style={{ color: 'var(--text-primary)' }}>
              Empresas / CNPJs
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Gerencie as empresas atendidas e selecione a empresa ativa do workspace
          </p>
        </div>
        <TaxioButton icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
          + Nova Empresa
        </TaxioButton>
      </div>

      {!empresas.length && (
        <TaxioCard>
          <div className="py-14 px-6 text-center max-w-2xl mx-auto">
            <div
              className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(26, 78, 216, 0.12)' }}
            >
              <Building2 className="w-12 h-12" style={{ color: 'var(--accent-royal)' }} />
            </div>
            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Nenhuma empresa cadastrada ainda
            </h3>
            <p className="text-sm leading-6 mb-6" style={{ color: 'var(--text-secondary)' }}>
              Cadastre o CNPJ dos seus clientes para organizar as classificacoes por empresa e
              preencher automaticamente o ERP, UF e regime tributario em cada consulta.
            </p>
            <TaxioButton onClick={openCreateModal}>+ Cadastrar primeira empresa</TaxioButton>
          </div>
        </TaxioCard>
      )}

      {!!empresas.length && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {empresas.map((empresa) => (
            <TaxioCard key={empresa.id}>
              <div className="flex gap-4">
                <div className="w-2 rounded-full" style={{ backgroundColor: empresa.cor }} />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                        {empresa.razaoSocial}
                      </h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {formatarCNPJ(empresa.cnpj)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleActivate(empresa.id)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: empresa.ativa ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-elevated)',
                        color: empresa.ativa ? 'var(--success)' : 'var(--text-secondary)'
                      }}
                    >
                      {empresa.ativa ? 'Ativa' : 'Ativar'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                      {empresa.regime.replace(/_/g, ' ')}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                      {empresa.erp.toUpperCase()}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                      {empresa.uf}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-5">
                    <TaxioButton variant="outline" icon={<Pencil className="w-4 h-4" />} onClick={() => openEditModal(empresa)}>
                      Editar
                    </TaxioButton>
                    <TaxioButton variant="outline" icon={<Trash2 className="w-4 h-4" />} onClick={() => handleDelete(empresa.id)}>
                      Excluir
                    </TaxioButton>
                  </div>
                </div>
              </div>
            </TaxioCard>
          ))}
        </div>
      )}

      {openModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setOpenModal(false)} />
          <div
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-xl mx-auto rounded-2xl border p-6 z-50"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              {editingEmpresa ? 'Editar empresa' : 'Nova empresa'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TaxioInput
                label="CNPJ"
                value={formData.cnpj}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    cnpj: aplicarMascaraCNPJ(event.target.value)
                  }))
                }
                placeholder="00.000.000/0000-00"
              />
              <TaxioInput
                label="Razao social"
                value={formData.razaoSocial}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    razaoSocial: event.target.value
                  }))
                }
              />
              <TaxioSelect
                label="Regime tributario"
                options={regimeOptions}
                value={formData.regime}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    regime: event.target.value
                  }))
                }
              />
              <TaxioSelect
                label="ERP"
                options={erpOptions}
                value={formData.erp}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    erp: event.target.value
                  }))
                }
              />
              <TaxioSelect
                label="UF principal"
                options={ufOptions}
                value={formData.uf}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    uf: event.target.value
                  }))
                }
              />
              <label
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
                style={{ backgroundColor: 'var(--bg-elevated)' }}
              >
                <input
                  type="checkbox"
                  checked={formData.ativa}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      ativa: event.target.checked
                    }))
                  }
                />
                <span style={{ color: 'var(--text-primary)' }}>Definir como empresa ativa</span>
              </label>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Cor identificadora
              </p>
              <div className="flex gap-3">
                {empresaColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData((current) => ({ ...current, cor: color }))}
                    className="w-10 h-10 rounded-full border-2"
                    style={{
                      backgroundColor: color,
                      borderColor: formData.cor === color ? '#FFFFFF' : 'transparent'
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <TaxioButton variant="outline" className="flex-1" onClick={() => setOpenModal(false)}>
                Cancelar
              </TaxioButton>
              <TaxioButton className="flex-1" onClick={handleSave}>
                Salvar empresa
              </TaxioButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
