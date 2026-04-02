import { RegimeTributario } from './groq';

export const erpOptions = [
  { value: '', label: 'Selecione o ERP' },
  { value: 'totvs', label: 'TOTVS Protheus' },
  { value: 'sap', label: 'SAP Business One' },
  { value: 'omie', label: 'Omie' },
  { value: 'bling', label: 'Bling' },
  { value: 'outro', label: 'Outro' }
];

export const ufOptions = [
  { value: '', label: 'Selecione a UF' },
  { value: 'AC', label: 'AC - Acre' },
  { value: 'AL', label: 'AL - Alagoas' },
  { value: 'AP', label: 'AP - Amapa' },
  { value: 'AM', label: 'AM - Amazonas' },
  { value: 'BA', label: 'BA - Bahia' },
  { value: 'CE', label: 'CE - Ceara' },
  { value: 'DF', label: 'DF - Distrito Federal' },
  { value: 'ES', label: 'ES - Espirito Santo' },
  { value: 'GO', label: 'GO - Goias' },
  { value: 'MA', label: 'MA - Maranhao' },
  { value: 'MT', label: 'MT - Mato Grosso' },
  { value: 'MS', label: 'MS - Mato Grosso do Sul' },
  { value: 'MG', label: 'MG - Minas Gerais' },
  { value: 'PA', label: 'PA - Para' },
  { value: 'PB', label: 'PB - Paraiba' },
  { value: 'PR', label: 'PR - Parana' },
  { value: 'PE', label: 'PE - Pernambuco' },
  { value: 'PI', label: 'PI - Piaui' },
  { value: 'RJ', label: 'RJ - Rio de Janeiro' },
  { value: 'RN', label: 'RN - Rio Grande do Norte' },
  { value: 'RS', label: 'RS - Rio Grande do Sul' },
  { value: 'RO', label: 'RO - Rondonia' },
  { value: 'RR', label: 'RR - Roraima' },
  { value: 'SC', label: 'SC - Santa Catarina' },
  { value: 'SP', label: 'SP - Sao Paulo' },
  { value: 'SE', label: 'SE - Sergipe' },
  { value: 'TO', label: 'TO - Tocantins' }
];

export const regimeOptions: Array<{ value: RegimeTributario; label: string }> = [
  { value: 'lucro_presumido', label: 'Lucro Presumido' },
  { value: 'lucro_real', label: 'Lucro Real' },
  { value: 'simples_nacional', label: 'Simples Nacional' }
];

export const empresaColors = ['#1A4ED8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#0EA5E9'];
