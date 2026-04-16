import React, { useState, useCallback, useRef } from 'react';
import { Building2, MapPin, Mail, Loader2, FileText, HelpCircle, ExternalLink } from 'lucide-react';
import { formatCNPJ, formatCEP, formatPhone, normalizeLogradouro, sanitizeAddressNumber, validateCNPJ } from '@/utils/validators';
import { toast } from 'sonner';
import { empresasApi, tomadoresApi } from '@/services/api';
import { lookupCep } from '@/services/cep';

export interface TomadorSectionData {
  nomeEmpresarial: string;
  nomeFantasia: string;
  cnpjCpf: string;
  inscricaoMunicipal: string;
  inscricaoEstadual: string;
  suframa: string;
  substitutoTributario: boolean;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  localidadeUf: string;
  email: string;
  whatsapp: string;
}

interface Props {
  data: TomadorSectionData;
  onChange: (data: TomadorSectionData) => void;
  onAutosave: () => void;
}

function formatCPF(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  return cleaned
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += parseInt(cleaned[i], 10) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (parseInt(cleaned[9], 10) !== rest) return false;
  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += parseInt(cleaned[i], 10) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return parseInt(cleaned[10], 10) === rest;
}

export function isCPF(value: string): boolean {
  return value.replace(/\D/g, '').length <= 11;
}

export function isRealCpf(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length > 0 && digits.length <= 11;
}

const formatSourceLabel = (source?: string) => {
  const normalized = String(source || '').trim().toLowerCase();
  if (!normalized) return 'Não informada';
  if (normalized === 'cnpja') return 'CNPJá';
  if (normalized === 'brasilapi') return 'BrasilAPI';
  if (normalized === 'receitaws') return 'ReceitaWS';
  if (normalized === 'brasilapi+receitaws') return 'BrasilAPI + ReceitaWS';
  if (normalized === 'plugnotas') return 'PlugNotas';
  if (normalized === 'hubdev_cadastropf' || normalized === 'hubdev' || normalized === 'hub_do_desenvolvedor') return 'Hub do Desenvolvedor';
  return source as string;
};

const clearAutofillFields = (current: TomadorSectionData): TomadorSectionData => ({
  ...current,
  nomeEmpresarial: '',
  nomeFantasia: '',
  inscricaoEstadual: '',
  suframa: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  localidadeUf: '',
  email: '',
  whatsapp: '',
});

export function mergeTomadorFromCnpjResult(
  current: TomadorSectionData,
  result: {
    razao_social?: string;
    nome_fantasia?: string;
    inscricao_estadual?: string;
    suframa?: string;
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    municipio?: string;
    uf?: string;
    email?: string;
    telefone?: string;
  },
): TomadorSectionData {
  return {
    ...current,
    nomeEmpresarial: result.razao_social || current.nomeEmpresarial,
    nomeFantasia: result.nome_fantasia || current.nomeFantasia,
    inscricaoEstadual: result.inscricao_estadual || current.inscricaoEstadual,
    suframa: result.suframa || current.suframa,
    cep: result.cep ? formatCEP(result.cep) : current.cep,
    logradouro: result.logradouro ? normalizeLogradouro(result.logradouro) : current.logradouro,
    numero: result.numero || current.numero,
    complemento: result.complemento || current.complemento,
    bairro: result.bairro || current.bairro,
    localidadeUf: result.municipio && result.uf
      ? `${result.municipio} - ${result.uf}`
      : current.localidadeUf,
    email: result.email || current.email,
    whatsapp: result.telefone ? formatPhone(result.telefone) : current.whatsapp,
  };
}

export function mergeTomadorFromCpfResult(
  current: TomadorSectionData,
  result: {
    nome?: string;
    email?: string;
    whatsapp?: string;
    telefone?: string;
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
): TomadorSectionData {
  return {
    ...current,
    nomeEmpresarial: result.nome || current.nomeEmpresarial,
    cep: result.endereco?.cep ? formatCEP(result.endereco.cep) : current.cep,
    logradouro: result.endereco?.logradouro ? normalizeLogradouro(result.endereco.logradouro) : current.logradouro,
    numero: result.endereco?.numero || current.numero,
    complemento: result.endereco?.complemento || current.complemento,
    bairro: result.endereco?.bairro || current.bairro,
    localidadeUf: result.endereco?.municipio && result.endereco?.uf
      ? `${result.endereco.municipio} - ${result.endereco.uf}`
      : current.localidadeUf,
    email: result.email || current.email,
    whatsapp: result.whatsapp ? formatPhone(result.whatsapp) : result.telefone ? formatPhone(result.telefone) : current.whatsapp,
  };
}

export function mergeTomadorFromCepResult(
  current: TomadorSectionData,
  result: {
    logradouro?: string;
    bairro?: string;
    municipio?: string;
    uf?: string;
  },
): TomadorSectionData {
  return {
    ...current,
    logradouro: result.logradouro ? normalizeLogradouro(result.logradouro) : current.logradouro,
    bairro: result.bairro || current.bairro,
    localidadeUf: result.municipio && result.uf
      ? `${result.municipio} - ${result.uf}`
      : current.localidadeUf,
  };
}

async function fetchCNPJData(cnpj: string) {
  const cleaned = cnpj.replace(/\D/g, '');
  const empresa = await empresasApi.previewByCnpj(cleaned);
  return {
    razao_social: empresa.razaoSocial || '',
    nome_fantasia: empresa.nomeFantasia || '',
    inscricao_estadual: empresa.inscricaoEstadual || '',
    suframa: empresa.suframa || '',
    cep: empresa.endereco?.cep || '',
    logradouro: empresa.endereco?.logradouro || '',
    numero: empresa.endereco?.numero || '',
    complemento: empresa.endereco?.complemento || '',
    bairro: empresa.endereco?.bairro || '',
    municipio: empresa.endereco?.cidade || empresa.endereco?.descricaoCidade || '',
    uf: empresa.endereco?.uf || empresa.endereco?.estado || '',
    email: empresa.email || '',
    telefone: empresa.whatsapp || empresa.fone || '',
    source: empresa.fonteConsulta || '',
  };
}

async function fetchCpfData(cpf: string) {
  const cleaned = cpf.replace(/\D/g, '');
  return tomadoresApi.lookupCpf(cleaned);
}

async function fetchCEPData(cep: string) {
  const data = await lookupCep(cep);
  return {
    logradouro: data.logradouro || '',
    bairro: data.bairro || '',
    municipio: data.cidade || '',
    uf: data.uf || '',
  };
}

const TomadorSection: React.FC<Props> = ({ data, onChange, onAutosave }) => {
  const [loadingCNPJ, setLoadingCNPJ] = useState(false);
  const [loadingCPF, setLoadingCPF] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [lookupSource, setLookupSource] = useState<string>('');
  const lastFetchedCNPJ = useRef('');
  const lastFetchedCPF = useRef('');
  const lastFetchedCEP = useRef('');
  const cnpjRequestSeq = useRef(0);
  const cpfRequestSeq = useRef(0);
  const cepRequestSeq = useRef(0);
  const dataRef = useRef(data);
  dataRef.current = data;

  const update = (field: keyof TomadorSectionData, value: string) => {
    const normalizedValue = field === 'logradouro'
      ? normalizeLogradouro(value)
      : field === 'numero'
          ? sanitizeAddressNumber(value)
        : value;
    onChange({ ...data, [field]: normalizedValue });
    onAutosave();
  };

  const buscarCNPJ = useCallback(async (cnpjValue: string) => {
    const cleaned = cnpjValue.replace(/\D/g, '');
    if (cleaned.length !== 14 || !validateCNPJ(cleaned)) return;
    if (lastFetchedCNPJ.current === cleaned) return;
    lastFetchedCNPJ.current = cleaned;
    const requestId = ++cnpjRequestSeq.current;
    setLoadingCNPJ(true);
    try {
      const result = await fetchCNPJData(cleaned);
      if (requestId !== cnpjRequestSeq.current) return;
      if (dataRef.current.cnpjCpf.replace(/\D/g, '') !== cleaned) return;
      const current = dataRef.current;
      const updated = mergeTomadorFromCnpjResult(current, result);
      onChange(updated);
      setLookupSource(result.source || '');
      onAutosave();
      toast.success('Dados do CNPJ preenchidos automaticamente!');

      const cepClean = (result.cep || '').replace(/\D/g, '');
      if (cepClean.length === 8 && (!result.logradouro && !result.bairro)) {
        lastFetchedCEP.current = '';
        buscarCEP(formatCEP(cepClean));
      }
    } catch {
      toast.error('Não foi possível consultar o CNPJ.');
    } finally {
      setLoadingCNPJ(false);
    }
  }, [onChange, onAutosave]);

  const buscarCPF = useCallback(async (cpfValue: string) => {
    const cleaned = cpfValue.replace(/\D/g, '');
    if (cleaned.length !== 11 || !validateCPF(cleaned)) return;
    if (lastFetchedCPF.current === cleaned) return;
    lastFetchedCPF.current = cleaned;
    const requestId = ++cpfRequestSeq.current;
    setLoadingCPF(true);
    try {
      const result = await fetchCpfData(cleaned);
      if (requestId !== cpfRequestSeq.current) return;
      if (dataRef.current.cnpjCpf.replace(/\D/g, '') !== cleaned) return;
      setLookupSource(result.source || '');

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
      onAutosave();
      toast.success('Dados do CPF preenchidos automaticamente!');

      const cepClean = (result.endereco?.cep || '').replace(/\D/g, '');
      if (cepClean.length === 8 && (!result.endereco?.logradouro && !result.endereco?.bairro)) {
        lastFetchedCEP.current = '';
        const cepResult = await fetchCEPData(cepClean);
        if (requestId !== cpfRequestSeq.current) return;
        if (dataRef.current.cnpjCpf.replace(/\D/g, '') !== cleaned) return;
        updated = mergeTomadorFromCepResult(updated, cepResult);
        onChange(updated);
        onAutosave();
      }
    } catch {
      toast.error('Não foi possível consultar o CPF.');
    } finally {
      if (requestId === cpfRequestSeq.current) {
        setLoadingCPF(false);
      }
    }
  }, [onChange, onAutosave]);

  const buscarCEP = useCallback(async (cepValue: string) => {
    const cleaned = cepValue.replace(/\D/g, '');
    if (cleaned.length !== 8) return;
    if (lastFetchedCEP.current === cleaned) return;
    lastFetchedCEP.current = cleaned;
    const requestId = ++cepRequestSeq.current;
    setLoadingCEP(true);
    try {
      const result = await fetchCEPData(cleaned);
      if (requestId !== cepRequestSeq.current) return;
      if (dataRef.current.cep.replace(/\D/g, '') !== cleaned) return;
      const current = dataRef.current;
      const updated = mergeTomadorFromCepResult(current, result);
      onChange(updated);
      onAutosave();
      toast.success('Endereço preenchido automaticamente!');
    } catch {
      toast.error('Não foi possível consultar o CEP.');
    } finally {
      setLoadingCEP(false);
    }
  }, [onChange, onAutosave]);

  const handleCNPJCPFChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.length <= 11 ? formatCPF(value) : formatCNPJ(value);
    const previousDigits = data.cnpjCpf.replace(/\D/g, '');
    const docChanged = previousDigits !== cleaned;
    if (docChanged) {
      lastFetchedCNPJ.current = '';
      lastFetchedCPF.current = '';
      cnpjRequestSeq.current += 1;
      cpfRequestSeq.current += 1;
      setLoadingCNPJ(false);
      setLoadingCPF(false);
      setLookupSource('');
    }
    const base = docChanged ? clearAutofillFields(data) : data;
    onChange({ ...base, cnpjCpf: formatted });
    onAutosave();
    if (cleaned.length === 14) {
      buscarCNPJ(formatted);
      return;
    }
    if (cleaned.length === 11 && validateCPF(cleaned)) {
      buscarCPF(formatted);
    }
  };

  const handleCEPChange = (value: string) => {
    const formatted = formatCEP(value);
    onChange({ ...data, cep: formatted });
    onAutosave();
    buscarCEP(formatted);
  };

  const currentIsCPF = isRealCpf(data.cnpjCpf);

  return (
    <div className="section-card">
      <h2 className="section-title">
        <Building2 className="w-5 h-5 text-primary" />
        Tomadores
      </h2>

      <div className={`grid grid-cols-1 ${currentIsCPF ? 'md:grid-cols-1' : 'md:grid-cols-3'} gap-4`}>
        <div>
          <label className="field-label flex items-center gap-1"><FileText className="w-3.5 h-3.5" />CNPJ/CPF*</label>
          <div className="flex gap-2">
            <input className="field-input" placeholder="00.000.000/0000-00" value={data.cnpjCpf} onChange={(e) => handleCNPJCPFChange(e.target.value)} maxLength={18} />
            {(loadingCNPJ || loadingCPF) && <div className="flex items-center px-2"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>}
          </div>
          {lookupSource && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Fonte do autocomplete: {formatSourceLabel(lookupSource)}
            </p>
          )}
        </div>
        {!currentIsCPF && (
          <>
            <div>
              <label className="field-label flex items-center gap-1.5">
                Inscrição Municipal
                <span className="group relative inline-flex">
                  <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground transition-colors group-hover:text-primary" />
                  <span className="invisible absolute bottom-[calc(100%-2px)] left-1/2 z-20 w-72 -translate-x-1/2 rounded-xl border border-border bg-popover px-3 py-2 text-[11px] font-normal leading-5 text-popover-foreground opacity-0 shadow-xl transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    Para descobrir a Inscrição Municipal e verificar se o tomador é substituto tributário, consulte o portal da Prefeitura de Manaus.
                    <a
                      href="https://nfse-prd.manaus.am.gov.br/nfse/servlet/hloginconsultacadastral"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-2"
                    >
                      Abrir consulta cadastral
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </span>
                </span>
              </label>
              <input
                className="field-input"
                placeholder="Inscrição municipal"
                value={data.inscricaoMunicipal}
                onChange={(e) => update('inscricaoMunicipal', e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Inscrição Estadual</label>
              <input
                className="field-input"
                placeholder="Inscrição estadual"
                value={data.inscricaoEstadual}
                onChange={(e) => update('inscricaoEstadual', e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div className={`grid grid-cols-1 ${currentIsCPF ? 'md:grid-cols-1' : 'md:grid-cols-[1fr_auto]'} gap-4 mt-4 items-end`}>
        <div>
          <label className="field-label">TOMADOR(A)</label>
          <input className="field-input" placeholder="Tomador(a)" value={data.nomeEmpresarial} onChange={(e) => update('nomeEmpresarial', e.target.value)} />
        </div>
        <div className="flex items-center gap-3 pb-1">
          <label className="field-label whitespace-nowrap mb-0">Substituto Tributário</label>
          <div className="flex items-center gap-0">
            <button type="button" className={`px-2 py-1 text-xs rounded-l-md border transition-colors ${data.substitutoTributario ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`} onClick={() => { onChange({ ...data, substitutoTributario: true }); onAutosave(); }}>Sim</button>
            <button type="button" className={`px-2 py-1 text-xs rounded-r-md border border-l-0 transition-colors ${!data.substitutoTributario ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`} onClick={() => { onChange({ ...data, substitutoTributario: false }); onAutosave(); }}>Não</button>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-border">
        <label className="field-label flex items-center gap-1 mb-4"><MapPin className="w-3.5 h-3.5" />Endereço</label>
        <div className="grid grid-cols-1 md:grid-cols-[0.4fr_2.1fr_0.35fr_1.1fr] gap-4">
          <div>
            <label className="field-label">CEP</label>
            <input className="field-input" placeholder="00000-000" value={formatCEP(data.cep)} onChange={(e) => handleCEPChange(e.target.value)} maxLength={9} />
            {loadingCEP && <Loader2 className="w-4 h-4 animate-spin text-primary mt-2" />}
          </div>
          <div>
            <label className="field-label">Logradouro</label>
            <input className="field-input" placeholder="Rua, Av., etc." value={data.logradouro} onChange={(e) => update('logradouro', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Número</label>
            <input className="field-input" placeholder="Nº" value={data.numero} onChange={(e) => update('numero', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Bairro/Distrito</label>
            <input className="field-input" placeholder="Bairro" value={data.bairro} onChange={(e) => update('bairro', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1.5fr_1fr] gap-4 mt-4">
          <div>
            <label className="field-label">Complemento</label>
            <input className="field-input" placeholder="Sala, Andar, etc." value={data.complemento} onChange={(e) => update('complemento', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Localidade / UF</label>
            <input className="field-input" placeholder="Cidade - UF" value={data.localidadeUf} onChange={(e) => update('localidadeUf', e.target.value)} />
          </div>
          <div>
            <label className="field-label flex items-center gap-1"><Mail className="w-3.5 h-3.5" />E-mail</label>
            <input className="field-input" type="email" placeholder="email@exemplo.com" value={data.email} onChange={(e) => update('email', e.target.value)} />
          </div>
          <div>
            <label className="field-label">WhatsApp</label>
            <input className="field-input" placeholder="(00) 00000-0000" value={data.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} onBlur={(e) => update('whatsapp', formatPhone(e.target.value))} />
          </div>
        </div>
      </div>

    </div>
  );
};

export default TomadorSection;
