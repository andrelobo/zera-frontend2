import React from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface Props {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  localidadeUf: string;
  onFieldChange: (field: string, value: string) => void;
  onCEPChange: (value: string) => void;
  loadingCEP: boolean;
}

const EnderecoCard: React.FC<Props> = ({
  cep, logradouro, numero, complemento, bairro, localidadeUf,
  onFieldChange, onCEPChange, loadingCEP,
}) => (
  <div className="section-card">
    <h2 className="section-title">
      <MapPin className="w-5 h-5 text-primary" />
      Endereço
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-[0.4fr_2.1fr_0.35fr_1.1fr] gap-4">
      <div>
        <label className="field-label">CEP</label>
        <input className="field-input" placeholder="00000-000" value={cep} onChange={(e) => onCEPChange(e.target.value)} maxLength={9} />
        {loadingCEP && <Loader2 className="w-4 h-4 animate-spin text-primary mt-2" />}
      </div>
      <div>
        <label className="field-label">Logradouro</label>
        <input className="field-input" placeholder="Rua, Av., etc." value={logradouro} onChange={(e) => onFieldChange('logradouro', e.target.value)} />
      </div>
      <div>
        <label className="field-label">Número</label>
        <input className="field-input" placeholder="Nº" value={numero} onChange={(e) => onFieldChange('numero', e.target.value)} />
      </div>
      <div>
        <label className="field-label">Bairro/Distrito</label>
        <input className="field-input" placeholder="Bairro" value={bairro} onChange={(e) => onFieldChange('bairro', e.target.value)} />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div>
        <label className="field-label">Complemento</label>
        <input className="field-input" placeholder="Complemento" value={complemento} onChange={(e) => onFieldChange('complemento', e.target.value)} />
      </div>
      <div>
        <label className="field-label">Localidade / UF</label>
        <input className="field-input" placeholder="Cidade - UF" value={localidadeUf} onChange={(e) => onFieldChange('localidadeUf', e.target.value)} />
      </div>
    </div>
  </div>
);

export default EnderecoCard;
