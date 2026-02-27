import { Building2, FileText, Loader2, MapPin } from 'lucide-react';

export interface TomadorSectionData {
  empresaCnpj: string;
  cpfCnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
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

interface TomadorSectionProps {
  data: TomadorSectionData;
  onChange: (field: keyof TomadorSectionData, value: string | boolean) => void;
  cepLoading?: boolean;
  cnpjLoading?: boolean;
}

const TomadorSection = ({ data, onChange, cepLoading, cnpjLoading }: TomadorSectionProps) => {
  return (
    <div className="section-card">
      <h2 className="section-title">
        <Building2 className="w-5 h-5 text-primary" />
        Tomadores
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr] gap-4">
        <div>
          <label className="field-label flex items-center gap-1"><FileText className="w-3.5 h-3.5" />CNPJ/CPF*</label>
          <div className="flex gap-2">
            <input
              className="field-input"
              placeholder="00.000.000/0000-00"
              value={data.cpfCnpj}
              onChange={(e) => onChange('cpfCnpj', e.target.value)}
              maxLength={18}
            />
            {cnpjLoading && (
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
            onChange={(e) => onChange('inscricaoMunicipal', e.target.value)}
          />
        </div>

        <div>
          <label className="field-label">Inscrição Estadual</label>
          <input
            className="field-input"
            placeholder="Inscrição"
            value={data.inscricaoEstadual}
            onChange={(e) => onChange('inscricaoEstadual', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mt-4 items-end">
        <div>
          <label className="field-label">TOMADOR(A)</label>
          <input
            className="field-input"
            placeholder="Tomador(a)"
            value={data.razaoSocial}
            onChange={(e) => onChange('razaoSocial', e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 pb-1">
          <label className="field-label whitespace-nowrap mb-0">Substituto Tributário</label>
          <div className="flex items-center gap-0">
            <button
              type="button"
              className={`px-2 py-1 text-xs rounded-l-md border transition-colors ${
                data.substitutoTributario
                  ? 'bg-destructive text-destructive-foreground border-destructive'
                  : 'bg-muted text-muted-foreground border-border hover:bg-accent'
              }`}
              onClick={() => onChange('substitutoTributario', true)}
            >
              Sim
            </button>
            <button
              type="button"
              className={`px-2 py-1 text-xs rounded-r-md border border-l-0 transition-colors ${
                !data.substitutoTributario
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted text-muted-foreground border-border hover:bg-accent'
              }`}
              onClick={() => onChange('substitutoTributario', false)}
            >
              Não
            </button>
          </div>
        </div>
      </div>

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
              onChange={(e) => onChange('cep', e.target.value)}
              maxLength={9}
            />
            {cepLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-primary mt-2" />
            )}
          </div>
          <div>
            <label className="field-label">Logradouro</label>
            <input
              className="field-input"
              placeholder="Rua, Av., etc."
              value={data.logradouro}
              onChange={(e) => onChange('logradouro', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Número</label>
            <input
              className="field-input"
              placeholder="Nº"
              value={data.numero}
              onChange={(e) => onChange('numero', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Bairro/Distrito</label>
            <input
              className="field-input"
              placeholder="Bairro"
              value={data.bairro}
              onChange={(e) => onChange('bairro', e.target.value)}
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
              onChange={(e) => onChange('localidadeUf', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">E-mail</label>
            <input
              className="field-input"
              type="email"
              placeholder="contato@empresa.com.br"
              value={data.email}
              onChange={(e) => onChange('email', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">WhatsApp</label>
            <input
              className="field-input"
              placeholder="(00) 00000-0000"
              value={data.whatsapp}
              onChange={(e) => onChange('whatsapp', e.target.value)}
              maxLength={15}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TomadorSection;
