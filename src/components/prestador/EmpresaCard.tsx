import React from 'react';
import { Building2, FileText, Loader2 } from 'lucide-react';

interface EmpresaData {
  cnpj: string;
  nomeEmpresarial: string;
  nomeFantasia: string;
  inscricaoMunicipal: string;
  inscricaoEstadual: string;
  suframa: string;
  dataOpcaoSimples?: string;
}

interface Props {
  data: EmpresaData;
  onFieldChange: (field: string, value: string) => void;
  onCNPJChange: (value: string) => void;
  loadingCNPJ: boolean;
  simplesStatus: boolean | null;
  onSimplesToggle: (value: boolean) => void;
}

const EmpresaCard: React.FC<Props> = ({
  data, onFieldChange, onCNPJChange, loadingCNPJ, simplesStatus, onSimplesToggle,
}) => (
  <div className="section-card">
    <h2 className="section-title">
      <Building2 className="w-5 h-5 text-primary" />
      Prestador(a)
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label className="field-label flex items-center gap-1"><FileText className="w-3.5 h-3.5" />CNPJ*</label>
        <div className="flex gap-2">
          <input
            className="field-input"
            placeholder="00.000.000/0000-00"
            value={data.cnpj}
            onChange={(e) => onCNPJChange(e.target.value)}
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
        <input className="field-input" placeholder="Inscrição" value={data.inscricaoMunicipal} onChange={(e) => onFieldChange('inscricaoMunicipal', e.target.value)} />
      </div>
      <div>
        <label className="field-label">Inscrição Estadual</label>
        <input className="field-input" placeholder="Inscrição Estadual" value={data.inscricaoEstadual} onChange={(e) => onFieldChange('inscricaoEstadual', e.target.value)} />
      </div>
      <div>
        <label className="field-label">Inscrição Suframa</label>
        <input className="field-input" placeholder="Suframa" value={data.suframa} onChange={(e) => onFieldChange('suframa', e.target.value)} />
      </div>
    </div>

    <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      <div className="md:col-span-2">
        <label className="field-label">Nome Empresarial</label>
        <input className="field-input" placeholder="Razão Social" value={data.nomeEmpresarial} onChange={(e) => onFieldChange('nomeEmpresarial', e.target.value)} />
      </div>
      <div>
        <label className="field-label">Nome Fantasia</label>
        <input className="field-input" placeholder="Nome Fantasia" value={data.nomeFantasia} onChange={(e) => onFieldChange('nomeFantasia', e.target.value)} />
      </div>
      <div>
        <div className="flex items-center gap-3">
          <label className="field-label whitespace-nowrap mb-0">Optante Simples</label>
          <div className="flex items-center gap-0">
            <button
              type="button"
              className={`px-2 py-1 text-xs rounded-l-md border transition-colors ${
                simplesStatus === true
                  ? 'bg-[hsl(144,72%,28%)] text-white border-[hsl(144,72%,28%)]'
                  : 'bg-muted text-muted-foreground border-border hover:bg-accent'
              }`}
              onClick={() => onSimplesToggle(true)}
            >Sim</button>
            <button
              type="button"
              className={`px-2 py-1 text-xs rounded-r-md border border-l-0 transition-colors ${
                simplesStatus === false
                  ? 'bg-destructive text-destructive-foreground border-destructive'
                  : 'bg-muted text-muted-foreground border-border hover:bg-accent'
              }`}
              onClick={() => onSimplesToggle(false)}
            >Não</button>
          </div>
        </div>
        {simplesStatus === true && (
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Opção desde: {data.dataOpcaoSimples || '00/00/0000'}
          </span>
        )}
      </div>
    </div>
  </div>
);

export default EmpresaCard;
