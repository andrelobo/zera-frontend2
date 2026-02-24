import { Building2, Mail, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface TomadorSectionData {
  empresaCnpj: string;
  cpfCnpj: string;
  razaoSocial: string;
  inscricaoMunicipal: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  email: string;
}

interface TomadorSectionProps {
  data: TomadorSectionData;
  onChange: (field: keyof TomadorSectionData, value: string) => void;
  disabledEmpresaCnpj?: boolean;
}

const TomadorSection = ({ data, onChange, disabledEmpresaCnpj = false }: TomadorSectionProps) => {
  return (
    <div className="section-card">
      <h2 className="section-title">
        <span className="section-title-icon section-title-icon-primary">
          <Building2 className="w-4 h-4" />
        </span>
        <span>
          O Tomador
          <span className="section-subtitle block">Cadastro do cliente/tomador do serviço</span>
        </span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="field-label">CNPJ da Empresa *</Label>
          <Input
            className="field-input"
            value={data.empresaCnpj}
            onChange={(e) => onChange('empresaCnpj', e.target.value)}
            placeholder="00.000.000/0000-00"
            disabled={disabledEmpresaCnpj}
          />
        </div>
        <div>
          <Label className="field-label">CPF/CNPJ Tomador *</Label>
          <Input
            className="field-input"
            value={data.cpfCnpj}
            onChange={(e) => onChange('cpfCnpj', e.target.value)}
            placeholder="000.000.000-00"
          />
        </div>
        <div>
          <Label className="field-label">Inscrição Municipal</Label>
          <Input
            className="field-input"
            value={data.inscricaoMunicipal}
            onChange={(e) => onChange('inscricaoMunicipal', e.target.value)}
            placeholder="Inscrição"
          />
        </div>
      </div>

      <div className="mt-4">
        <Label className="field-label">Nome/Razão Social *</Label>
        <Input
          className="field-input"
          value={data.razaoSocial}
          onChange={(e) => onChange('razaoSocial', e.target.value)}
          placeholder="Nome do tomador"
        />
      </div>

      <div className="mt-5 pt-5 border-t border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <span className="section-title-icon section-title-icon-secondary h-6 w-6 rounded-md">
            <MapPin className="w-3.5 h-3.5" />
          </span>
          Endereço
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr_0.8fr] gap-4">
          <div>
            <Label className="field-label">CEP</Label>
            <Input
              className="field-input"
              value={data.cep}
              onChange={(e) => onChange('cep', e.target.value)}
              placeholder="00000-000"
            />
          </div>
          <div>
            <Label className="field-label">Logradouro</Label>
            <Input
              className="field-input"
              value={data.logradouro}
              onChange={(e) => onChange('logradouro', e.target.value)}
              placeholder="Rua, avenida..."
            />
          </div>
          <div>
            <Label className="field-label">Número</Label>
            <Input
              className="field-input"
              value={data.numero}
              onChange={(e) => onChange('numero', e.target.value)}
              placeholder="Nº"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_0.6fr] gap-4 mt-4">
          <div>
            <Label className="field-label">Complemento</Label>
            <Input
              className="field-input"
              value={data.complemento}
              onChange={(e) => onChange('complemento', e.target.value)}
              placeholder="Sala, bloco, etc."
            />
          </div>
          <div>
            <Label className="field-label">Bairro</Label>
            <Input
              className="field-input"
              value={data.bairro}
              onChange={(e) => onChange('bairro', e.target.value)}
              placeholder="Bairro"
            />
          </div>
          <div>
            <Label className="field-label">Município</Label>
            <Input
              className="field-input"
              value={data.municipio}
              onChange={(e) => onChange('municipio', e.target.value)}
              placeholder="Município"
            />
          </div>
          <div>
            <Label className="field-label">UF</Label>
            <Input
              className="field-input"
              value={data.uf}
              onChange={(e) => onChange('uf', e.target.value.toUpperCase())}
              placeholder="UF"
              maxLength={2}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <span className="section-title-icon section-title-icon-accent h-6 w-6 rounded-md">
            <Mail className="w-3.5 h-3.5" />
          </span>
          Contato
        </h3>
        <div>
          <Label className="field-label">E-mail</Label>
          <Input
            className="field-input"
            type="email"
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="contato@empresa.com.br"
          />
        </div>
      </div>
    </div>
  );
};

export default TomadorSection;
