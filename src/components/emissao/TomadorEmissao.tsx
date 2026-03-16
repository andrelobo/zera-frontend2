import { useMemo, useRef, useState, useEffect } from 'react';
import { Users, FileText, Loader2, Search, ChevronDown } from 'lucide-react';
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

const toLocalidadeUf = (tomador: Tomador) => {
  const municipio = tomador.endereco?.municipio || '';
  const uf = tomador.endereco?.uf || '';
  return [municipio, uf].filter(Boolean).join(' - ');
};

const TomadorEmissao = ({ data, onChange, tomadores = [], onTomadorSelecionado, loadingTomadores }: Props) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const selecionarTomador = (t: Tomador) => {
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
            className="flex items-center gap-1 text-[11px] py-1 px-2 rounded-md border border-[hsl(144,72%,28%)] text-[hsl(144,72%,28%)] hover:bg-[hsl(144,72%,28%)]/10 transition-colors font-bold"
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
              onChange={(e) => onChange({ ...data, cnpjCpf: formatDoc(e.target.value) })}
              maxLength={18}
            />
            {loadingTomadores && (
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
