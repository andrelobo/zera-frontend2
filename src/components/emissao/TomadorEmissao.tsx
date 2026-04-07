import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Users, FileText, Loader2, Search, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { empresasApi } from '@/services/api';
import { lookupCep } from '@/services/cep';
import { normalizeLogradouro, validateCNPJ } from '@/utils/validators';
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

const TomadorEmissao = ({ data, onChange, tomadores = [], onTomadorSelecionado, loadingTomadores }: Props) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastFetchedCnpj = useRef('');
  const cnpjRequestSeq = useRef(0);
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
  const tomadorExistente = useMemo(() => {
    const digits = data.cnpjCpf.replace(/\D/g, '');
    if (digits.length !== 11 && digits.length !== 14) return null;
    return tomadores.find((item) => item.cpfCnpj.replace(/\D/g, '') === digits) || null;
  }, [data.cnpjCpf, tomadores]);
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
    onChange({
      cnpjCpf: formatDoc(t.cpfCnpj),
      nomeRazaoSocial: t.razaoSocial || '',
      inscricaoMunicipal: t.inscricaoMunicipal || '',
      cep: t.endereco?.cep || '',
      logradouro: t.endereco?.logradouro || '',
      numero: t.endereco?.numero || '',
      complemento: t.endereco?.complemento || '',
      bairro: t.endereco?.bairro || '',
      localidadeUf: toLocalidadeUf(t),
      email: t.email || '',
      pais: 'Brasil',
    });
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

  const handleDocChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = formatDoc(value);
    const previousDigits = data.cnpjCpf.replace(/\D/g, '');
    const docChanged = previousDigits !== cleaned;
    if (docChanged) {
      lastFetchedCnpj.current = '';
      cnpjRequestSeq.current += 1;
      setLoadingCnpj(false);
    }
    const base = docChanged ? clearAutofillFields(data) : data;
    onChange({ ...base, cnpjCpf: formatted });

    if (cleaned.length === 14) {
      buscarCnpj(formatted);
      return;
    }

    setLoadingCnpj(false);
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
            {(loadingTomadores || loadingCnpj) && (
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
          <label className="field-label">Razão Social</label>
          <input
            className="field-input"
            placeholder="Tomador(a)"
            value={data.nomeRazaoSocial}
            onChange={(e) => onChange({ ...data, nomeRazaoSocial: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};

export default TomadorEmissao;
