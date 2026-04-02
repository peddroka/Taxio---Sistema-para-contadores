import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { TaxioButton } from '../components/taxio/TaxioButton';
import { TaxioCard } from '../components/taxio/TaxioCard';
import { TaxioInput } from '../components/taxio/TaxioInput';
import { TaxioTextarea } from '../components/taxio/TaxioTextarea';
import { getEmpresaAtiva } from '../../services/empresas';
import { salvarClassificacao } from '../../services/storage';
import { validarNCM } from '../../services/validarNCM';
import { dispararWebhook } from '../../services/webhook';

interface ValidationState {
  isValid: boolean;
  message?: string;
}

export default function ConsultaManual() {
  const [ncm, setNcm] = useState('');
  const [cest, setCest] = useState('');
  const [cst, setCst] = useState('');
  const [cClassTrib, setCClassTrib] = useState('');
  const [descricao, setDescricao] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [ncmInfo, setNcmInfo] = useState<{
    descricao: string;
    aliquotaIPI: number;
    valido: boolean;
  } | null>(null);

  const [ncmValidation, setNcmValidation] = useState<ValidationState | null>(null);
  const [cestValidation, setCestValidation] = useState<ValidationState | null>(null);
  const [cstValidation, setCstValidation] = useState<ValidationState | null>(null);
  const [cClassValidation, setCClassValidation] = useState<ValidationState | null>(null);

  const validateNCMInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length === 0) {
      setNcmValidation(null);
      return;
    }

    if (cleaned.length !== 8) {
      setNcmValidation({ isValid: false, message: 'NCM deve ter 8 digitos' });
    } else {
      setNcmValidation({ isValid: true, message: 'NCM valido' });
    }
  };

  const validateCEST = (value: string) => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length === 0) {
      setCestValidation(null);
      return;
    }

    if (cleaned.length !== 7) {
      setCestValidation({ isValid: false, message: 'CEST deve ter 7 digitos' });
    } else {
      setCestValidation({ isValid: true, message: 'CEST valido' });
    }
  };

  const validateCST = (value: string) => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length === 0) {
      setCstValidation(null);
      return;
    }

    if (cleaned.length !== 3) {
      setCstValidation({ isValid: false, message: 'CST deve ter 3 digitos' });
    } else {
      setCstValidation({ isValid: true, message: 'CST valido' });
    }
  };

  const validateCClass = (value: string) => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length === 0) {
      setCClassValidation(null);
      return;
    }

    if (cleaned.length !== 3) {
      setCClassValidation({ isValid: false, message: 'cClassTrib deve ter 3 digitos' });
    } else {
      setCClassValidation({ isValid: true, message: 'cClassTrib valido' });
    }
  };

  const formatNCM = (value: string) => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 4)}.${cleaned.slice(4)}`;

    return `${cleaned.slice(0, 4)}.${cleaned.slice(4, 6)}.${cleaned.slice(6, 8)}`;
  };

  const formatCEST = (value: string) => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;

    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 7)}`;
  };

  async function handleNCMBlur() {
    const cleaned = ncm.replace(/\D/g, '');

    if (cleaned.length !== 8) {
      setNcmInfo(null);
      return;
    }

    const info = await validarNCM(ncm);

    setNcmInfo({
      descricao: info.descricao,
      aliquotaIPI: info.aliquotaIPI,
      valido: info.valido
    });
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const empresaAtiva = getEmpresaAtiva();

    salvarClassificacao(
      descricao,
      {
        ncm,
        cest,
        cst,
        cClassTrib,
        confianca: 100,
        descricaoNCM: ncmInfo?.descricao || 'Classificacao manual informada pelo usuario',
        descricaoCEST: '',
        descricaoCST: '',
        descricaoCClassTrib: '',
        temSubstituicaoTributaria:
          cst === '500' || cst === '010' || cClassTrib === '500' || cClassTrib === '010',
        observacoes: 'Classificacao preenchida manualmente pelo usuario.'
      },
      'manual',
      empresaAtiva?.erp || '',
      empresaAtiva?.uf || '',
      {
        regime: empresaAtiva?.regime || 'lucro_presumido',
        empresaId: empresaAtiva?.id,
        empresaNome: empresaAtiva?.razaoSocial
      }
    );
    void dispararWebhook('classificacao_salva', {
      produto: descricao,
      origem: 'manual',
      ncm,
      cst,
      empresaId: empresaAtiva?.id
    });

    setNcm('');
    setCest('');
    setCst('');
    setCClassTrib('');
    setDescricao('');
    setNcmInfo(null);
    setNcmValidation(null);
    setCestValidation(null);
    setCstValidation(null);
    setCClassValidation(null);
    setSuccessMessage('Classificacao manual salva no historico local.');
  };

  const ValidationIcon = ({ validation }: { validation: ValidationState | null }) => {
    if (!validation) return null;

    return validation.isValid ? (
      <Check className="w-4 h-4" style={{ color: 'var(--success)' }} />
    ) : (
      <X className="w-4 h-4" style={{ color: 'var(--danger)' }} />
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Consulta manual
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Insira e valide classificacoes fiscais manualmente
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <TaxioCard title="Formulario de classificacao">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <TaxioInput
                label="NCM (8 digitos)"
                placeholder="0000.00.00"
                value={ncm}
                onChange={(event) => {
                  if (successMessage) {
                    setSuccessMessage(null);
                  }

                  const formatted = formatNCM(event.target.value);
                  setNcm(formatted);
                  validateNCMInput(formatted);
                  setNcmInfo(null);
                }}
                onBlur={handleNCMBlur}
                maxLength={10}
                icon={<ValidationIcon validation={ncmValidation} />}
                error={ncmValidation && !ncmValidation.isValid ? ncmValidation.message : undefined}
              />

              {ncmInfo && (
                <div
                  className="mt-2 rounded-lg px-3 py-2 text-xs"
                  style={{
                    backgroundColor: ncmInfo.valido ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    color: ncmInfo.valido ? 'var(--success)' : 'var(--danger)'
                  }}
                >
                  <div className="font-semibold">
                    {ncmInfo.valido ? ncmInfo.descricao : 'NCM nao encontrado na tabela TIPI'}
                  </div>
                  {ncmInfo.valido && (
                    <div className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                      IPI: {ncmInfo.aliquotaIPI}% 
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <TaxioInput
                label="CEST (7 digitos)"
                placeholder="00.000.00"
                value={cest}
                onChange={(event) => {
                  if (successMessage) {
                    setSuccessMessage(null);
                  }

                  const formatted = formatCEST(event.target.value);
                  setCest(formatted);
                  validateCEST(formatted);
                }}
                maxLength={9}
                icon={<ValidationIcon validation={cestValidation} />}
                error={cestValidation && !cestValidation.isValid ? cestValidation.message : undefined}
              />
            </div>

            <div>
              <TaxioInput
                label="CST (3 digitos)"
                placeholder="000"
                value={cst}
                onChange={(event) => {
                  if (successMessage) {
                    setSuccessMessage(null);
                  }

                  const cleaned = event.target.value.replace(/\D/g, '');
                  setCst(cleaned);
                  validateCST(cleaned);
                }}
                maxLength={3}
                icon={<ValidationIcon validation={cstValidation} />}
                error={cstValidation && !cstValidation.isValid ? cstValidation.message : undefined}
              />
            </div>

            <div>
              <TaxioInput
                label="cClassTrib (3 digitos)"
                placeholder="000"
                value={cClassTrib}
                onChange={(event) => {
                  if (successMessage) {
                    setSuccessMessage(null);
                  }

                  const cleaned = event.target.value.replace(/\D/g, '');
                  setCClassTrib(cleaned);
                  validateCClass(cleaned);
                }}
                maxLength={3}
                icon={<ValidationIcon validation={cClassValidation} />}
                error={cClassValidation && !cClassValidation.isValid ? cClassValidation.message : undefined}
              />
            </div>
          </div>

          <TaxioTextarea
            label="Descricao do produto"
            placeholder="Informe a descricao completa do produto para referencia"
            rows={4}
            value={descricao}
            onChange={(event) => {
              if (successMessage) {
                setSuccessMessage(null);
              }

              setDescricao(event.target.value);
            }}
            className="mb-6"
          />

          <TaxioButton
            type="submit"
            disabled={
              !ncmValidation?.isValid ||
              !cestValidation?.isValid ||
              !cstValidation?.isValid ||
              !cClassValidation?.isValid ||
              !descricao
            }
          >
            Validar e salvar
          </TaxioButton>

          {successMessage && (
            <div
              className="mt-4 rounded-xl border px-4 py-3 text-sm"
              style={{
                borderColor: 'rgba(16, 185, 129, 0.35)',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                color: 'var(--success)'
              }}
            >
              {successMessage}
            </div>
          )}
        </TaxioCard>

        {(ncmValidation || cestValidation || cstValidation || cClassValidation) && (
          <TaxioCard className="mt-6" elevated>
            <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Validacao em tempo real
            </h3>
            <div className="space-y-2">
              {[
                { label: 'NCM', validation: ncmValidation },
                { label: 'CEST', validation: cestValidation },
                { label: 'CST', validation: cstValidation },
                { label: 'cClassTrib', validation: cClassValidation }
              ].map(
                (item) =>
                  item.validation && (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: item.validation.isValid
                          ? 'rgba(16, 185, 129, 0.1)'
                          : 'rgba(239, 68, 68, 0.1)'
                      }}
                    >
                      <ValidationIcon validation={item.validation} />
                      <span
                        className="font-semibold text-sm"
                        style={{
                          color: item.validation.isValid ? 'var(--success)' : 'var(--danger)'
                        }}
                      >
                        {item.label}:
                      </span>
                      <span
                        className="text-sm"
                        style={{
                          color: item.validation.isValid ? 'var(--success)' : 'var(--danger)'
                        }}
                      >
                        {item.validation.message}
                      </span>
                    </div>
                  )
              )}
            </div>
          </TaxioCard>
        )}
      </form>
    </div>
  );
}
