import React from 'react';
import { FileText } from 'lucide-react';

interface Props {
  nfseNum: string;
  onNfseNumChange: (v: string) => void;
  dpsNum: string;
  onDpsNumChange: (v: string) => void;
  serieDpsNum: string;
  onSerieDpsNumChange: (v: string) => void;
}

const IdentificacaoDocumentoCard: React.FC<Props> = ({
  nfseNum, onNfseNumChange,
  dpsNum, onDpsNumChange,
  serieDpsNum, onSerieDpsNumChange,
}) => (
  <div className="section-card">
    <h2 className="section-title">
      <FileText className="w-5 h-5 text-primary" />
      Portal Nacional
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="field-label">NFS-e Nº</label>
        <input className="field-input" placeholder="Número" value={nfseNum} onChange={e => onNfseNumChange(e.target.value.replace(/\D/g, ''))} />
      </div>
      <div>
        <label className="field-label">DPS Nº</label>
        <input className="field-input" placeholder="Número" value={dpsNum} onChange={e => onDpsNumChange(e.target.value.replace(/\D/g, ''))} />
      </div>
      <div>
        <label className="field-label">Série DPS Nº</label>
        <input className="field-input" placeholder="Número" value={serieDpsNum} onChange={e => onSerieDpsNumChange(e.target.value.replace(/\D/g, ''))} />
      </div>
    </div>
  </div>
);

export default IdentificacaoDocumentoCard;
