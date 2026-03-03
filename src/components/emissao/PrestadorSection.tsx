import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Building2, Loader2, FileText, MapPin, Shield } from 'lucide-react';
import { formatCNPJ, formatCEP, formatPhone, validateCNPJ } from '@/utils/validators';
import { toast } from 'sonner';

interface PrestadorData {
  nomeEmpresarial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoMunicipal: string;
  inscricaoEstadual: string;
  suframa: string;
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
  data: PrestadorData;
  onChange: (data: PrestadorData) => void;
  onAutosave: () => void;
  onSimplesDetected?: (isOptante: boolean) => void;
  compact?: boolean;
  optanteSimples?: boolean | null;
}

async function fetchCNPJData(cnpj: string) {
  const cleaned = cnpj.replace(/\D/g, '');

  // Usa BrasilAPI como fonte primária (mesma do Cartão CNPJ)
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
    if (res.ok) {
      const data = await res.json();
      // Concatena tipo de logradouro ao logradouro
      let logradouroCompleto = data.logradouro || '';
      if (data.descricao_tipo_de_logradouro && logradouroCompleto && !logradouroCompleto.toUpperCase().startsWith(data.descricao_tipo_de_logradouro.toUpperCase())) {
        logradouroCompleto = `${data.descricao_tipo_de_logradouro} ${logradouroCompleto}`;
      }
      return {
        razao_social: data.razao_social || '',
        nome_fantasia: data.nome_fantasia || '',
        cep: data.cep || '',
        logradouro: logradouroCompleto,
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        municipio: data.municipio || '',
        uf: data.uf || '',
        email: data.email || '',
        telefone: data.ddd_telefone_1?.replace(/\D/g, '') || '',
        opcao_pelo_simples: data.opcao_pelo_simples ?? null,
      };
    }
  } catch {
    // fallback abaixo
  }

  // Fallback: ReceitaWS
  const res = await fetch(`https://receitaws.com.br/v1/cnpj/${cleaned}`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error('CNPJ não encontrado');
  const d = await res.json();
  if (d.status === 'ERROR') throw new Error('CNPJ não encontrado');
  let logradouroCompleto = d.logradouro || '';
  if (d.tipo && logradouroCompleto && !logradouroCompleto.toUpperCase().startsWith(d.tipo.toUpperCase())) {
    logradouroCompleto = `${d.tipo} ${logradouroCompleto}`;
  }
  return {
    razao_social: d.nome || '',
    nome_fantasia: d.fantasia || '',
    cep: d.cep?.replace(/[.\-]/g, '') || '',
    logradouro: logradouroCompleto,
    numero: d.numero || '',
    complemento: d.complemento || '',
    bairro: d.bairro || '',
    municipio: d.municipio || '',
    uf: d.uf || '',
    email: d.email || '',
    telefone: d.telefone?.replace(/\D/g, '') || '',
    opcao_pelo_simples: d.simples?.optante ?? null,
  };
}

async function fetchCEPData(cep: string) {
  const cleaned = cep.replace(/\D/g, '');
  const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleaned}`);
  if (!res.ok) throw new Error('CEP não encontrado');
  const data = await res.json();
  return {
    logradouro: data.street || '',
    bairro: data.neighborhood || '',
    municipio: data.city || '',
    uf: data.state || '',
  };
}

const PrestadorSection: React.FC<Props> = ({ data, onChange, onAutosave, onSimplesDetected, compact = false, optanteSimples }) => {
  const [loadingCNPJ, setLoadingCNPJ] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [simplesStatus, setSimplesStatus] = useState<{ simples: boolean | null; mei: boolean | null }>({ simples: optanteSimples ?? null, mei: null });
  const [simplesChecked, setSimplesChecked] = useState(optanteSimples != null);
  const lastFetchedCNPJ = useRef('');
  const lastFetchedCEP = useRef('');
  const dataRef = useRef(data);
  dataRef.current = data;

  // Sync simples status when loaded from DB
  useEffect(() => {
    if (optanteSimples != null && !simplesChecked) {
      setSimplesStatus({ simples: optanteSimples, mei: null });
      setSimplesChecked(true);
    }
  }, [optanteSimples]);

  const update = (field: keyof PrestadorData, value: string) => {
    onChange({ ...data, [field]: value });
    onAutosave();
  };

  const buscarCNPJ = useCallback(async (cnpjValue: string) => {
    const cleaned = cnpjValue.replace(/\D/g, '');
    if (cleaned.length !== 14 || !validateCNPJ(cleaned)) return;
    if (lastFetchedCNPJ.current === cleaned) return;
    lastFetchedCNPJ.current = cleaned;
    setLoadingCNPJ(true);
    try {
      const result = await fetchCNPJData(cleaned);
      const current = dataRef.current;
      const updated: PrestadorData = {
        ...current,
        nomeEmpresarial: result.razao_social || current.nomeEmpresarial,
        nomeFantasia: result.nome_fantasia || current.nomeFantasia,
        cep: result.cep ? formatCEP(result.cep) : current.cep,
        logradouro: result.logradouro || current.logradouro,
        numero: result.numero || current.numero,
        complemento: result.complemento || current.complemento,
        bairro: result.bairro || current.bairro,
        localidadeUf: result.municipio && result.uf
          ? `${result.municipio} - ${result.uf}`
          : current.localidadeUf,
        email: result.email || current.email,
        whatsapp: result.telefone
          ? formatPhone(result.telefone)
          : current.whatsapp,
      };
      onChange(updated);
      onAutosave();
      setSimplesStatus({ simples: result.opcao_pelo_simples === true ? true : false, mei: null });
      setSimplesChecked(true);
      if (result.opcao_pelo_simples === true) {
        onSimplesDetected?.(true);
      } else {
        onSimplesDetected?.(false);
      }
      toast.success('Dados do CNPJ preenchidos automaticamente!');
    } catch {
      setSimplesChecked(false);
      toast.error('Não foi possível consultar o CNPJ.');
    } finally {
      setLoadingCNPJ(false);
    }
  }, [onChange, onAutosave]);

  const buscarCEP = useCallback(async (cepValue: string) => {
    const cleaned = cepValue.replace(/\D/g, '');
    if (cleaned.length !== 8) return;
    if (lastFetchedCEP.current === cleaned) return;
    lastFetchedCEP.current = cleaned;
    setLoadingCEP(true);
    try {
      const result = await fetchCEPData(cleaned);
      const current = dataRef.current;
      const updated: PrestadorData = {
        ...current,
        logradouro: result.logradouro || current.logradouro,
        bairro: result.bairro || current.bairro,
        localidadeUf: result.municipio && result.uf
          ? `${result.municipio} - ${result.uf}`
          : current.localidadeUf,
      };
      onChange(updated);
      onAutosave();
      toast.success('Endereço preenchido automaticamente!');
    } catch {
      toast.error('Não foi possível consultar o CEP.');
    } finally {
      setLoadingCEP(false);
    }
  }, [onChange, onAutosave]);

  const handleCNPJChange = (value: string) => {
    const formatted = formatCNPJ(value);
    onChange({ ...data, cnpj: formatted });
    onAutosave();
    buscarCNPJ(formatted);
  };

  const handleCEPChange = (value: string) => {
    const formatted = formatCEP(value);
    onChange({ ...data, cep: formatted });
    onAutosave();
    buscarCEP(formatted);
  };

  return (
    <div className="section-card">
      <h2 className="section-title">
        <Building2 className="w-5 h-5 text-primary" />
        O Prestador
      </h2>

      {/* Identificação */}
      <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-[1fr_1fr_3fr]' : 'md:grid-cols-[1fr_1fr_1fr_1fr]'} gap-4`}>
        <div>
          <label className="field-label flex items-center gap-1"><FileText className="w-3.5 h-3.5" />CNPJ*</label>
          <div className="flex gap-2">
            <input
              className="field-input"
              placeholder="00.000.000/0000-00"
              value={data.cnpj}
              onChange={(e) => handleCNPJChange(e.target.value)}
              maxLength={18}
            />
            {loadingCNPJ && (
              <div className="flex items-center px-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="field-label">Inscrição Municipal</label>
          <input
            className="field-input"
            placeholder="Inscrição"
            value={data.inscricaoMunicipal}
            onChange={(e) => update('inscricaoMunicipal', e.target.value)}
          />
        </div>

        {compact && (
          <div>
            <label className="field-label">Nome Empresarial</label>
            <input
              className="field-input"
              placeholder="Razão Social"
              value={data.nomeEmpresarial}
              onChange={(e) => update('nomeEmpresarial', e.target.value)}
            />
          </div>
        )}

        {!compact && (
          <div>
            <label className="field-label">Inscrição Estadual</label>
            <input
              className="field-input"
              placeholder="Inscrição Estadual"
              value={data.inscricaoEstadual}
              onChange={(e) => update('inscricaoEstadual', e.target.value)}
            />
          </div>
        )}

        {!compact && (
          <div>
            <label className="field-label">Inscrição Suframa</label>
            <input
              className="field-input"
              placeholder="Suframa"
              value={data.suframa}
              onChange={(e) => update('suframa', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Nome Empresarial + Simples Nacional - only show as separate row when NOT compact */}
      {!compact && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
          <div>
            <label className="field-label">Nome Empresarial</label>
            <input
              className="field-input"
              placeholder="Razão Social"
              value={data.nomeEmpresarial}
              onChange={(e) => update('nomeEmpresarial', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 pb-1">
            <label className="field-label whitespace-nowrap mb-0">Optante Simples Nacional</label>
            <div className="flex items-center gap-0">
              <button
                type="button"
                className={`px-2 py-1 text-xs rounded-l-md border transition-colors ${
                  simplesStatus.simples === true
                    ? 'bg-[hsl(144,72%,28%)] text-white border-[hsl(144,72%,28%)]'
                    : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                }`}
                onClick={() => {
                  setSimplesStatus(prev => ({ ...prev, simples: true }));
                  setSimplesChecked(true);
                  onSimplesDetected?.(true);
                }}
              >
                Sim
              </button>
              <button
                type="button"
                className={`px-2 py-1 text-xs rounded-r-md border border-l-0 transition-colors ${
                  simplesStatus.simples === false
                    ? 'bg-destructive text-destructive-foreground border-destructive'
                    : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                }`}
                onClick={() => {
                  setSimplesStatus(prev => ({ ...prev, simples: false }));
                  setSimplesChecked(true);
                  onSimplesDetected?.(false);
                }}
              >
                Não
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Endereço */}
      {!compact && (
        <div className="mt-5 pt-5 border-t border-border">
          <label className="field-label flex items-center gap-1 mb-4">
            <MapPin className="w-3.5 h-3.5" />
            Endereço
          </label>
          <div className="grid grid-cols-1 md:grid-cols-[0.4fr_2.1fr_0.35fr_1.1fr] gap-4">
            <div>
              <label className="field-label">CEP</label>
              <input
                className="field-input"
                placeholder="00000-000"
                value={data.cep}
                onChange={(e) => handleCEPChange(e.target.value)}
                maxLength={9}
              />
              {loadingCEP && (
                <Loader2 className="w-4 h-4 animate-spin text-primary mt-2" />
              )}
            </div>
            <div>
              <label className="field-label">Logradouro</label>
              <input
                className="field-input"
                placeholder="Rua, Av., etc."
                value={data.logradouro}
                onChange={(e) => update('logradouro', e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Número</label>
              <input
                className="field-input"
                placeholder="Nº"
                value={data.numero}
                onChange={(e) => update('numero', e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Bairro/Distrito</label>
              <input
                className="field-input"
                placeholder="Bairro"
                value={data.bairro}
                onChange={(e) => update('bairro', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="field-label">Localidade / UF</label>
              <input
                className="field-input"
                placeholder="Cidade - UF"
                value={data.localidadeUf}
                onChange={(e) => update('localidadeUf', e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">E-mail</label>
              <input
                className="field-input"
                type="email"
                placeholder="contato@empresa.com.br"
                value={data.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">WhatsApp</label>
              <input
                className="field-input"
                placeholder="(00) 00000-0000"
                value={data.whatsapp}
                onChange={(e) => update('whatsapp', formatPhone(e.target.value))}
                maxLength={15}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrestadorSection;
