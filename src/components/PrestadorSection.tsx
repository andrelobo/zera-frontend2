import EmpresaCard from '@/components/prestador/EmpresaCard';
import EnderecoCard from '@/components/prestador/EnderecoCard';
import ContatoCard from '@/components/prestador/ContatoCard';

export interface PrestadorSectionData {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoMunicipal: string;
  inscricaoEstadual: string;
  suframa: string;
  opcaoPeloSimples: '' | 'true' | 'false';
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  email: string;
  whatsapp: string;
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
  const handleSimplesToggle = (value: boolean) => {
    onChange('opcaoPeloSimples', value ? 'true' : 'false');
  };

  const localidadeUf = data.cidade && data.uf ? `${data.cidade} - ${data.uf}` : '';

  return (
    <div className="space-y-4">
      <EmpresaCard
        data={{
          cnpj: data.cnpj,
          nomeEmpresarial: data.razaoSocial,
          nomeFantasia: data.nomeFantasia,
          inscricaoMunicipal: data.inscricaoMunicipal,
          inscricaoEstadual: data.inscricaoEstadual,
          suframa: data.suframa,
        }}
        onFieldChange={(field, value) => {
          const mapping: Record<string, keyof PrestadorSectionData> = {
            nomeEmpresarial: 'razaoSocial',
            nomeFantasia: 'nomeFantasia',
            inscricaoMunicipal: 'inscricaoMunicipal',
            inscricaoEstadual: 'inscricaoEstadual',
            suframa: 'suframa',
          };
          if (mapping[field]) {
            onChange(mapping[field], value);
          }
        }}
        onCNPJChange={(value) => {
          if (!isEdit) {
            onChange('cnpj', value);
          }
        }}
        loadingCNPJ={loadingCnpj}
        simplesStatus={data.opcaoPeloSimples === 'true' ? true : data.opcaoPeloSimples === 'false' ? false : null}
        onSimplesToggle={handleSimplesToggle}
      />

      <EnderecoCard
        cep={data.cep}
        logradouro={data.endereco}
        numero={data.numero}
        complemento={data.complemento}
        bairro={data.bairro}
        localidadeUf={localidadeUf}
        onFieldChange={(field, value) => {
          if (field === 'logradouro') onChange('endereco', value);
          if (field === 'numero') onChange('numero', value);
          if (field === 'complemento') onChange('complemento', value);
          if (field === 'bairro') onChange('bairro', value);
          if (field === 'localidadeUf') {
            const [cidade, uf] = value.split('-').map((v) => v.trim());
            onChange('cidade', cidade || '');
            onChange('uf', (uf || '').toUpperCase());
          }
        }}
        onCEPChange={onCepChange}
        loadingCEP={Boolean(cepLoading)}
      />
      {(cepHint || cepError) && (
        <div className="px-1">
          {cepHint && <p className="text-xs text-muted-foreground">{cepHint}</p>}
          {cepError && <p className="text-xs text-destructive">{cepError}</p>}
        </div>
      )}

      <ContatoCard
        email={data.email}
        whatsapp={data.whatsapp}
        onFieldChange={(field, value) => {
          if (field === 'email') onChange('email', value);
          if (field === 'whatsapp') onChange('whatsapp', value);
        }}
      />
    </div>
  );
};

export default PrestadorSection;
