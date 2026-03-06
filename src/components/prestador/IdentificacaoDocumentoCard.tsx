import React from 'react';
import { CheckCircle2, FileText } from 'lucide-react';

interface Props {
  nfseNum: string;
  onNfseNumChange: (v: string) => void;
  dpsNum: string;
  onDpsNumChange: (v: string) => void;
  serieDpsNum: string;
  onSerieDpsNumChange: (v: string) => void;
  certificado?: {
    filename?: string;
    uploadedAt?: string;
  } | null;
}

const IdentificacaoDocumentoCard: React.FC<Props> = ({
  nfseNum, onNfseNumChange,
  dpsNum, onDpsNumChange,
  serieDpsNum, onSerieDpsNumChange,
  certificado,
}) => {
  const certificadoImportado = Boolean(certificado?.filename || certificado?.uploadedAt);
  const uploadedAtLabel = certificado?.uploadedAt
    ? new Date(certificado.uploadedAt).toLocaleString('pt-BR')
    : '';

  return (
    <div className="section-card">
      <h2 className="section-title">
        <FileText className="w-5 h-5 text-primary" />
        Portal Nacional
      </h2>
      {certificadoImportado && (
        <div className="mb-3 rounded-md border border-emerald-600/25 bg-emerald-600/10 px-3 py-2">
          <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              Certificado digital já importado
              {certificado?.filename ? `: ${certificado.filename}` : ''}
              {uploadedAtLabel ? ` (${uploadedAtLabel})` : ''}.
            </span>
          </p>
        </div>
      )}
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
};

export default IdentificacaoDocumentoCard;
