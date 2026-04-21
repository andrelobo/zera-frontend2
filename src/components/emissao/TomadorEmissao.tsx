import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Users, FileText, Loader2, Search, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { empresasApi, tomadoresApi } from '@/services/api';
import { lookupCep } from '@/services/cep';
import { formatCEP, normalizeLogradouro, sanitizeAddressNumber, validateCNPJ } from '@/utils/validators';
import type { Tomador } from '@/types/api';

export interface TomadorEmissaoData {
  cnpjCpf: string;
  nomeRazaoSocial: string;
  inscricaoMunicipal: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  localidadeUf: string;
  email: string;
  pais: string;
}

interface Props {
  data: TomadorEmissaoData;
  onChange: (data: TomadorEmissaoData) => void;
  tomadores?: Tomador[];
  onTomadorSelecionado?: (tomador: Tomador) => void;
  loadingTomadores?: boolean;
  syncTomadorCadastro?: boolean;
  onSyncTomadorCadastroChange?: (value: boolean) => void;
}

export const INITIAL_TOMADOR: TomadorEmissaoData = {
  cnpjCpf: '',
  nomeRazaoSocial: '',
  inscricaoMunicipal: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  localidadeUf: '',
  email: '',
  pais: 'Brasil',
};

const formatDoc = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  return digits
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

const isCPF = (value: string) => value.replace(/\D/g, '').length <= 11;

const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(cleaned[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (Number(cleaned[9]) !== rest) return false;
  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(cleaned[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return Number(cleaned[10]) === rest;
};

const clearAutofillFields = (current: TomadorEmissaoData): TomadorEmissaoData => ({
  ...current,
  nomeRazaoSocial: '',
  inscricaoMunicipal: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  localidadeUf: '',
  email: '',
});

const toLocalidadeUf = (tomador: Tomador) => {
  const municipio = tomador.endereco?.municipio || '';
  const uf = tomador.endereco?.uf || '';
  return [municipio, uf].filter(Boolean).join(' - ');
};

const tomadorToEmissaoData = (tomador: Tomador): TomadorEmissaoData => ({
  cnpjCpf: formatDoc(tomador.cpfCnpj),
  nomeRazaoSocial: tomador.razaoSocial || '',
  inscricaoMunicipal: tomador.inscricaoMunicipal || '',
  cep: tomador.endereco?.cep || '',
  logradouro: tomador.endereco?.logradouro || '',
  numero: tomador.endereco?.numero || '',
  complemento: tomador.endereco?.complemento || '',
  bairro: tomador.endereco?.bairro || '',
  localidadeUf: toLocalidadeUf(tomador),
  email: tomador.email || '',
  pais: 'Brasil',
});

async function fetchCnpjData(cnpj: string) {
  const cleaned = cnpj.replace(/\D/g, '');
  const empresa = await empresasApi.previewByCnpj(cleaned);
  return {
    razaoSocial: empresa.razaoSocial || '',
    inscricaoMunicipal: empresa.inscricaoMunicipal || '',
    cep: empresa.endereco?.cep || '',
    logradouro: empresa.endereco?.logradouro || '',
    numero: empresa.endereco?.numero || '',
    complemento: empresa.endereco?.complemento || '',
    bairro: empresa.endereco?.bairro || '',
    municipio: empresa.endereco?.cidade || empresa.endereco?.descricaoCidade || '',
    uf: empresa.endereco?.uf || empresa.endereco?.estado || '',
    email: empresa.email || '',
  };
}

async function fetchCpfData(cpf: string) {
  const cleaned = cpf.replace(/\D/g, '');
  return tomadoresApi.lookupCpf(cleaned);
}

async function fetchCepData(cep: string) {
  const data = await lookupCep(cep);
  return {
    logradouro: data.logradouro || '',
    bairro: data.bairro || '',
    municipio: data.cidade || '',
    uf: data.uf || '',
  };
}

const mergeTomadorFromCnpjResult = (
  current: TomadorEmissaoData,
  result: {
    razaoSocial?: string;
    inscricaoMunicipal?: string;
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    municipio?: string;
    uf?: string;
    email?: string;
  },
): TomadorEmissaoData => ({
  ...current,
  nomeRazaoSocial: result.razaoSocial || current.nomeRazaoSocial,
  inscricaoMunicipal: result.inscricaoMunicipal || current.inscricaoMunicipal,
  cep: result.cep || current.cep,
  logradouro: result.logradouro ? normalizeLogradouro(result.logradouro) : current.logradouro,
  numero: result.numero || current.numero,
  complemento: result.complemento || current.complemento,
  bairro: result.bairro || current.bairro,
  localidadeUf: result.municipio && result.uf
    ? `${result.municipio} - ${result.uf}`
    : current.localidadeUf,
  email: result.email || current.email,
});

const mergeTomadorFromCpfResult = (
  current: TomadorEmissaoData,
  result: {
    nome?: string;
    email?: string;
    endereco?: {
      cep?: string;
      logradouro?: string;
      numero?: string;
      complemento?: string;
      bairro?: string;
      municipio?: string;
      uf?: string;
    };
  },
): TomadorEmissaoData => ({
  ...current,
  nomeRazaoSocial: result.nome || current.nomeRazaoSocial,
  cep: result.endereco?.cep || current.cep,
  logradouro: result.endereco?.logradouro ? normalizeLogradouro(result.endereco.logradouro) : current.logradouro,
  numero: result.endereco?.numero || current.numero,
  complemento: result.endereco?.complemento || current.complemento,
  bairro: result.endereco?.bairro || current.bairro,
  localidadeUf: result.endereco?.municipio && result.endereco?.uf
    ? `${result.endereco.municipio} - ${result.endereco.uf}`
    : current.localidadeUf,
  email: result.email || current.email,
});

const mergeTomadorFromCepResult = (
  current: TomadorEmissaoData,
  result: {
    logradouro?: string;
    bairro?: string;
    municipio?: string;
    uf?: string;
  },
): TomadorEmissaoData => ({
  ...current,
  logradouro: result.logradouro ? normalizeLogradouro(result.logradouro) : current.logradouro,
  bairro: result.bairro || current.bairro,
  localidadeUf: result.municipio && result.uf
    ? `${result.municipio} - ${result.uf}`
    : current.localidadeUf,
});

const TomadorEmissao = ({
  data,
  onChange,
  tomadores = [],
  onTomadorSelecionado,
  loadingTomadores,
  syncTomadorCadastro = false,
  onSyncTomadorCadastroChange,
}: Props) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [loadingCpf, setLoadingCpf] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastFetchedCnpj = useRef('');
  const lastFetchedCpf = useRef('');
  const cnpjRequestSeq = useRef(0);
  const cpfRequestSeq = useRef(0);
  const cepRequestSeq = useRef(0);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const tomadoresView = useMemo(() => tomadores.slice(0, 30), [tomadores]);
  const currentIsCPF = isCPF(data.cnpjCpf);
  const docDigits = data.cnpjCpf.replace(/\D/g, '');
  const tomadorExistente = useMemo(() => {
    const digits = docDigits;
    if (digits.length !== 11 && digits.length !== 14) return null;
    return tomadores.find((item) => item.cpfCnpj.replace(/\D/g, '') === digits) || null;
  }, [docDigits, tomadores]);
  const hasCompleteRequiredAddress =
    data.cep.replace(/\D/g, '').length === 8 &&
    Boolean(data.logradouro.trim()) &&
    Boolean(data.numero.trim()) &&
    Boolean(data.bairro.trim());
  const shouldShowAddressFields =
    (docDigits.length === 11 || docDigits.length === 14) &&
    (!tomadorExistente || !hasCompleteRequiredAddress);
  const shouldShowSyncChoice =
    (docDigits.length === 11 || docDigits.length === 14) &&
    !tomadorExistente;
  const shouldPulseSelector =
    tomadoresView.length > 0 &&
    !showDropdown &&
    !tomadorExistente &&
    !data.cnpjCpf.trim() &&
    !data.nomeRazaoSocial.trim();
  const selectorButtonClass = shouldPulseSelector
    ? 'border-[hsl(144,72%,28%)] bg-[hsl(144,72%,28%)] text-white ring-2 ring-[hsl(144,72%,28%)]/35 shadow-[0_0_0_4px_rgba(20,123,61,0.18)] motion-safe:animate-[pulse_0.85s_ease-in-out_infinite]'
    : 'border-[hsl(144,72%,28%)] text-[hsl(144,72%,28%)] hover:bg-[hsl(144,72%,28%)]/10';

  const selecionarTomador = (t: Tomador) => {
    lastFetchedCnpj.current = t.cpfCnpj.replace(/\D/g, '');
    onChange(tomadorToEmissaoData(t));
    onTomadorSelecionado?.(t);
    setShowDropdown(false);
  };

  const buscarCnpj = useCallback(async (docValue: string) => {
    const cleaned = docValue.replace(/\D/g, '');
    if (cleaned.length !== 14 || !validateCNPJ(cleaned)) return;
    if (lastFetchedCnpj.current === cleaned) return;
    lastFetchedCnpj.current = cleaned;
    const requestId = ++cnpjRequestSeq.current;
    setLoadingCnpj(true);
    try {
      const result = await fetchCnpjData(cleaned);
      if (requestId !== cnpjRequestSeq.current) return;
      if (dataRef.current.cnpjCpf.replace(/\D/g, '') !== cleaned) return;

      let updated = mergeTomadorFromCnpjResult(dataRef.current, result);
      onChange(updated);
      toast.success('Dados do tomador preenchidos!');

      const cepClean = String(result.cep || '').replace(/\D/g, '');
      if (cepClean.length === 8 && (!result.logradouro && !result.bairro)) {
        const cepResult = await fetchCepData(cepClean);
        if (requestId !== cnpjRequestSeq.current) return;
        if (dataRef.current.cnpjCpf.replace(/\D/g, '') !== cleaned) return;
        updated = mergeTomadorFromCepResult(updated, cepResult);
        onChange(updated);
      }
    } catch {
      toast.error('Não foi possível consultar o CNPJ.');
    } finally {
      if (requestId === cnpjRequestSeq.current) {
        setLoadingCnpj(false);
      }
    }
  }, [onChange]);

  const buscarCpf = useCallback(async (docValue: string) => {
    const cleaned = docValue.replace(/\D/g, '');
    if (cleaned.length !== 11 || !validateCPF(cleaned)) return;
    if (lastFetchedCpf.current === cleaned) return;
    lastFetchedCpf.current = cleaned;
    const requestId = ++cpfRequestSeq.current;
    setLoadingCpf(true);
    try {
      const result = await fetchCpfData(cleaned);
      if (requestId !== cpfRequestSeq.current) return;
      if (dataRef.current.cnpjCpf.replace(/\D/g, '') !== cleaned) return;

      if (!result.found) {
        toast.error('CPF não encontrado na consulta externa.');
        return;
      }

      if (!result.usefulData) {
        toast.error('CPF encontrado, mas os dados vieram ofuscados por LGPD.');
        return;
      }

      let updated = mergeTomadorFromCpfResult(dataRef.current, result);
      onChange(updated);
      toast.success('Dados do tomador preenchidos!');

      const cepClean = String(result.endereco?.cep || '').replace(/\D/g, '');
      if (cepClean.length === 8 && (!result.endereco?.logradouro && !result.endereco?.bairro)) {
        const cepResult = await fetchCepData(cepClean);
        if (requestId !== cpfRequestSeq.current) return;
        if (dataRef.current.cnpjCpf.replace(/\D/g, '') !== cleaned) return;
        updated = mergeTomadorFromCepResult(updated, cepResult);
        onChange(updated);
      }
    } catch {
      toast.error('Não foi possível consultar o CPF.');
    } finally {
      if (requestId === cpfRequestSeq.current) {
        setLoadingCpf(false);
      }
    }
  }, [onChange]);

  const handleDocChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = formatDoc(value);
    const previousDigits = data.cnpjCpf.replace(/\D/g, '');
    const docChanged = previousDigits !== cleaned;
    if (docChanged) {
      lastFetchedCnpj.current = '';
      lastFetchedCpf.current = '';
      cnpjRequestSeq.current += 1;
      cpfRequestSeq.current += 1;
      cepRequestSeq.current += 1;
      setLoadingCnpj(false);
      setLoadingCpf(false);
      setLoadingCep(false);
    }
    const base = docChanged ? clearAutofillFields(data) : data;
    onChange({ ...base, cnpjCpf: formatted });

    if (cleaned.length === 14) {
      buscarCnpj(formatted);
      return;
    }

    if (cleaned.length === 11 && validateCPF(cleaned)) {
      const tomadorLocal = tomadores.find((item) => item.cpfCnpj.replace(/\D/g, '') === cleaned);
      if (tomadorLocal) {
        onChange(tomadorToEmissaoData(tomadorLocal));
        onTomadorSelecionado?.(tomadorLocal);
      }
      buscarCpf(formatted);
      return;
    }

    setLoadingCnpj(false);
    setLoadingCpf(false);
  };

  const updateField = (field: keyof TomadorEmissaoData, value: string) => {
    const normalizedValue = field === 'logradouro'
      ? normalizeLogradouro(value)
      : field === 'numero'
        ? sanitizeAddressNumber(value)
        : value;
    onChange({ ...data, [field]: normalizedValue });
  };

  const buscarCep = useCallback(async (cepValue: string) => {
    const cleaned = cepValue.replace(/\D/g, '');
    if (cleaned.length !== 8) return;
    const requestId = ++cepRequestSeq.current;
    setLoadingCep(true);
    try {
      const result = await fetchCepData(cleaned);
      if (requestId !== cepRequestSeq.current) return;
      onChange(mergeTomadorFromCepResult({ ...dataRef.current, cep: formatCEP(cleaned) }, result));
    } catch {
      toast.error('Não foi possível consultar o CEP.');
    } finally {
      if (requestId === cepRequestSeq.current) {
        setLoadingCep(false);
      }
    }
  }, [onChange]);

  const handleCepChange = (value: string) => {
    const formatted = formatCEP(value);
    onChange({ ...data, cep: formatted });
    const cleaned = formatted.replace(/\D/g, '');
    if (cleaned.length === 8) {
      buscarCep(formatted);
      return;
    }
    cepRequestSeq.current += 1;
    setLoadingCep(false);
  };

  return (
    <div className="section-card">
      <div className="flex items-center justify-between mb-2">
        <h2 className="section-title mb-0">
          <Users className="w-5 h-5 text-primary" />
          Tomador(a)
        </h2>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown((prev) => !prev)}
            className={`flex items-center gap-1 text-[11px] py-1 px-2 rounded-md border transition-colors font-bold ${selectorButtonClass}`}
          >
            <Search className="w-3.5 h-3.5" />
            Selecione ({tomadoresView.length})
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && tomadoresView.length > 0 && (
            <div className="absolute right-0 top-full mt-1 w-80 max-h-60 overflow-y-auto bg-card border border-border rounded-lg shadow-lg z-20">
              {tomadoresView.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selecionarTomador(t)}
                  className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                >
                  <p className="text-sm font-medium truncate text-foreground">{t.razaoSocial}</p>
                  <p className="text-xs text-muted-foreground">{formatDoc(t.cpfCnpj)} · {toLocalidadeUf(t) || '—'}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-1 ${currentIsCPF ? 'md:grid-cols-[1fr_3fr]' : 'md:grid-cols-[1fr_1fr_3fr]'} gap-3`}>
        <div>
          <label className="field-label flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />CNPJ/CPF*
          </label>
          <div className="flex gap-2">
            <input
              className="field-input"
              placeholder="00.000.000/0000-00"
              value={data.cnpjCpf}
              onChange={(e) => handleDocChange(e.target.value)}
              maxLength={18}
            />
            {(loadingTomadores || loadingCnpj || loadingCpf) && (
              <div className="flex items-center px-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            )}
          </div>
          {tomadorExistente && (
            <p className="mt-1 text-[11px] font-medium text-[hsl(144,72%,28%)]">
              Tomador já cadastrado: {tomadorExistente.razaoSocial || formatDoc(tomadorExistente.cpfCnpj)}
            </p>
          )}
        </div>

        {!currentIsCPF && (
          <div>
            <label className="field-label">Inscrição Municipal</label>
            <input
              className="field-input"
              placeholder="Inscrição"
              value={data.inscricaoMunicipal}
              onChange={(e) => onChange({ ...data, inscricaoMunicipal: e.target.value })}
            />
          </div>
        )}

        <div>
          <label className="field-label">{currentIsCPF ? 'Nome' : 'Razão Social'}</label>
          <input
            className="field-input"
            placeholder="Tomador(a)"
            value={data.nomeRazaoSocial}
            onChange={(e) => onChange({ ...data, nomeRazaoSocial: e.target.value })}
          />
        </div>
      </div>

      {shouldShowAddressFields && (
        <div className="mt-4 pt-4 border-t border-border/70">
          <h3 className="text-sm font-semibold text-foreground mb-3">Dados do tomador para esta nota</h3>

          <div className="grid grid-cols-1 md:grid-cols-[0.8fr_2fr_0.7fr_1.2fr] gap-3">
            <div>
              <label className="field-label">CEP*</label>
              <div className="flex gap-2">
                <input
                  className="field-input"
                  placeholder="00000-000"
                  value={formatCEP(data.cep)}
                  onChange={(e) => handleCepChange(e.target.value)}
                  maxLength={9}
                />
                {loadingCep && (
                  <div className="flex items-center px-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="field-label">Logradouro*</label>
              <input
                className="field-input"
                placeholder="Rua, Av., etc."
                value={data.logradouro}
                onChange={(e) => updateField('logradouro', e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">Número*</label>
              <input
                className="field-input"
                placeholder="Nº"
                value={data.numero}
                onChange={(e) => updateField('numero', e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">Bairro*</label>
              <input
                className="field-input"
                placeholder="Bairro"
                value={data.bairro}
                onChange={(e) => updateField('bairro', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr_1fr] gap-3 mt-3">
            <div>
              <label className="field-label">Complemento</label>
              <input
                className="field-input"
                placeholder="Sala, andar, etc."
                value={data.complemento}
                onChange={(e) => updateField('complemento', e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">Cidade / UF</label>
              <input
                className="field-input"
                placeholder="Manaus - AM"
                value={data.localidadeUf}
                onChange={(e) => updateField('localidadeUf', e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">E-mail</label>
              <input
                className="field-input"
                placeholder="email@dominio.com"
                value={data.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {shouldShowSyncChoice && (
        <div className="mt-4 pt-4 border-t border-border/70 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Cadastrar no cadastro de tomadores?</p>
            <p className="text-xs text-muted-foreground">Use Sim quando este tomador deve aparecer nos próximos autocompletes.</p>
          </div>

          <div className="inline-flex w-fit rounded-md border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => onSyncTomadorCadastroChange?.(false)}
              className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                !syncTomadorCadastro
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted/60'
              }`}
            >
              Não
            </button>
            <button
              type="button"
              onClick={() => onSyncTomadorCadastroChange?.(true)}
              className={`px-3 py-1.5 text-xs font-bold transition-colors border-l border-border ${
                syncTomadorCadastro
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted/60'
              }`}
            >
              Sim
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TomadorEmissao;
