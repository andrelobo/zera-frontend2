import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Loader2, Globe } from 'lucide-react';

export interface LocalPrestacaoData {
  pais: string;
  uf: string;
  municipio: string;
}

interface Props {
  data: LocalPrestacaoData;
  onChange: (data: LocalPrestacaoData) => void;
}

interface MunicipioOption {
  nome: string;
  id: number;
}

const UFS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'
];

const LocalPrestacaoSection: React.FC<Props> = ({ data, onChange }) => {
  const [municipios, setMunicipios] = useState<MunicipioOption[]>([]);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);
  const [searchMunicipio, setSearchMunicipio] = useState(data.municipio || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const lastUf = useRef('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data.uf) fetchMunicipios(data.uf);
  }, []);

  const update = (field: keyof LocalPrestacaoData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const fetchMunicipios = useCallback(async (uf: string) => {
    if (!uf || lastUf.current === uf) return;
    lastUf.current = uf;
    setLoadingMunicipios(true);
    try {
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
      if (res.ok) {
        const list = await res.json();
        setMunicipios(list.map((m: any) => ({ nome: m.nome, id: m.id })));
      }
    } catch {
      // silently fail
    } finally {
      setLoadingMunicipios(false);
    }
  }, []);

  const handleUfChange = (uf: string) => {
    onChange({ ...data, uf, municipio: '' });
    setSearchMunicipio('');
    if (uf) fetchMunicipios(uf);
  };

  const handleMunicipioSearch = (value: string) => {
    setSearchMunicipio(value);
    setShowDropdown(true);
  };

  const selectMunicipio = (nome: string) => {
    onChange({ ...data, municipio: nome });
    setSearchMunicipio(nome);
    setShowDropdown(false);
  };

  const filteredMunicipios = municipios.filter(m =>
    m.nome.toLowerCase().includes(searchMunicipio.toLowerCase())
  );

  return (
    <div className="section-card">
      <h2 className="section-title">
        <MapPin className="w-5 h-5 text-primary" />
        Local da Prestação do Serviço
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_0.5fr_3fr] gap-2">
        <div>
          <label className="field-label flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />País
          </label>
          <input
            className="field-input"
            placeholder="Brasil"
            value={data.pais}
            onChange={(e) => update('pais', e.target.value)}
          />
        </div>

        <div>
          <label className="field-label">UF*</label>
          <select
            className="field-input"
            value={data.uf}
            onChange={(e) => handleUfChange(e.target.value)}
          >
            <option value="">Selecione</option>
            {UFS.map(uf => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>

        <div className="relative" ref={dropdownRef}>
          <label className="field-label">Município*</label>
          <div className="flex gap-2">
            <input
              className="field-input"
              placeholder={data.uf ? 'Buscar município...' : 'Selecione a UF primeiro'}
              value={searchMunicipio || data.municipio}
              onChange={(e) => handleMunicipioSearch(e.target.value)}
              onFocus={() => data.uf && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              disabled={!data.uf}
            />
            {loadingMunicipios && (
              <div className="flex items-center px-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            )}
          </div>
          {showDropdown && filteredMunicipios.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-card border border-border rounded-lg shadow-lg">
              {filteredMunicipios.slice(0, 20).map(m => (
                <button
                  key={m.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onMouseDown={() => selectMunicipio(m.nome)}
                >
                  {m.nome}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocalPrestacaoSection;
