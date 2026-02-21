import { Building2, Loader2, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface PrestadorSectionData {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoMunicipal: string;
  opcaoPeloSimples: '' | 'true' | 'false';
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  email: string;
  telefone: string;
}

interface PrestadorSectionProps {
  data: PrestadorSectionData;
  isEdit: boolean;
  loadingCnpj: boolean;
  onAutocompleteByCnpj: () => void;
  onChange: (field: keyof PrestadorSectionData, value: string) => void;
  onCepChange: (value: string) => void;
  cepHint?: string;
  cepLoading?: boolean;
  cepError?: string;
}

const PrestadorSection = ({
  data,
  isEdit,
  loadingCnpj,
  onAutocompleteByCnpj,
  onChange,
  onCepChange,
  cepHint,
  cepLoading,
  cepError,
}: PrestadorSectionProps) => {
  const simplesLabel = data.opcaoPeloSimples === 'true'
    ? 'Optante'
    : data.opcaoPeloSimples === 'false'
      ? 'Não optante'
      : '';

  return (
    <div className="section-card">
      <h2 className="section-title">
        <Building2 className="w-5 h-5 text-primary" />
        O Prestador
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_3fr] gap-4">
        <div>
          <Label className="field-label">CNPJ *</Label>
          <div className="flex gap-2">
            <Input
              className="field-input"
              placeholder="00.000.000/0000-00"
              value={data.cnpj}
              onChange={(e) => onChange('cnpj', e.target.value)}
              maxLength={18}
              disabled={isEdit}
            />
            {!isEdit && (
              <Button type="button" variant="outline" onClick={onAutocompleteByCnpj} disabled={loadingCnpj}>
                {loadingCnpj ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Auto'}
              </Button>
            )}
          </div>
        </div>

        <div>
          <Label className="field-label">Inscrição Municipal</Label>
          <Input
            className="field-input"
            placeholder="Inscrição"
            value={data.inscricaoMunicipal}
            onChange={(e) => onChange('inscricaoMunicipal', e.target.value)}
          />
        </div>

        <div>
          <Label className="field-label">Nome Empresarial</Label>
          <Input
            className="field-input"
            placeholder="Razão social da empresa"
            value={data.razaoSocial}
            onChange={(e) => onChange('razaoSocial', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <Label className="field-label">Nome Fantasia</Label>
          <Input
            className="field-input"
            placeholder="Nome fantasia"
            value={data.nomeFantasia}
            onChange={(e) => onChange('nomeFantasia', e.target.value)}
          />
        </div>
        <div>
          <Label className="field-label">Optante Simples Nacional</Label>
          <div className="field-input flex items-center gap-2 cursor-default h-10">
            <span
              className={`w-3 h-3 rounded-full inline-block ${
                data.opcaoPeloSimples === 'true'
                  ? 'bg-green-500'
                  : data.opcaoPeloSimples === 'false'
                    ? 'bg-red-500'
                    : 'bg-muted-foreground/40'
              }`}
            />
            <span className="text-sm text-foreground">{simplesLabel}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-border">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4" />
          Endereço
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr_0.8fr] gap-4">
          <div>
            <Label className="field-label">CEP</Label>
            <Input
              className="field-input"
              placeholder="00000-000"
              value={data.cep}
              onChange={(e) => onCepChange(e.target.value)}
              maxLength={9}
            />
            {cepHint && <p className="text-xs text-muted-foreground mt-1">{cepHint}</p>}
            {cepLoading && <Loader2 className="w-4 h-4 animate-spin text-primary mt-2" />}
            {cepError && <p className="text-xs text-destructive mt-1">{cepError}</p>}
          </div>
          <div>
            <Label className="field-label">Logradouro</Label>
            <Input
              className="field-input"
              placeholder="Rua, Av., etc."
              value={data.endereco}
              onChange={(e) => onChange('endereco', e.target.value)}
            />
          </div>
          <div>
            <Label className="field-label">Número</Label>
            <Input
              className="field-input"
              placeholder="Nº"
              value={data.numero}
              onChange={(e) => onChange('numero', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_0.6fr] gap-4 mt-4">
          <div>
            <Label className="field-label">Complemento</Label>
            <Input
              className="field-input"
              placeholder="Sala, andar, etc."
              value={data.complemento}
              onChange={(e) => onChange('complemento', e.target.value)}
            />
          </div>
          <div>
            <Label className="field-label">Bairro</Label>
            <Input
              className="field-input"
              placeholder="Bairro"
              value={data.bairro}
              onChange={(e) => onChange('bairro', e.target.value)}
            />
          </div>
          <div>
            <Label className="field-label">Cidade</Label>
            <Input
              className="field-input"
              placeholder="Cidade"
              value={data.cidade}
              onChange={(e) => onChange('cidade', e.target.value)}
            />
          </div>
          <div>
            <Label className="field-label">UF</Label>
            <Input
              className="field-input"
              placeholder="UF"
              value={data.uf}
              onChange={(e) => onChange('uf', e.target.value)}
              maxLength={2}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-border">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4" />
          Contato
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="field-label">E-mail</Label>
            <Input
              className="field-input"
              type="email"
              placeholder="contato@empresa.com.br"
              value={data.email}
              onChange={(e) => onChange('email', e.target.value)}
            />
          </div>
          <div>
            <Label className="field-label">Telefone</Label>
            <Input
              className="field-input"
              placeholder="(00) 00000-0000"
              value={data.telefone}
              onChange={(e) => onChange('telefone', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrestadorSection;
