import { Building2, Loader2, FileText, MapPin } from 'lucide-react';

export interface PrestadorSectionData {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoMunicipal: string;
  inscricaoEstadual: string;
  suframa: string;
  situacaoCadastral: string;
  dataSituacaoCadastral: string;
  dataInicioAtividade: string;
  porte: string;
  naturezaJuridica: string;
  capitalSocial: string;
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
  const handleSimplesChange = (value: 'true' | 'false') => {
    onChange('opcaoPeloSimples', value);
  };

  return (
    <div className="section-card">
      <h2 className="section-title">
        <Building2 className="w-5 h-5 text-primary" />
        O Prestador
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr] gap-4">
        <div>
          <label className="field-label flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            CNPJ*
          </label>
          <div className="flex gap-2">
            <input
              className="field-input"
              placeholder="00.000.000/0000-00"
              value={data.cnpj}
              onChange={(e) => onChange('cnpj', e.target.value)}
              maxLength={18}
              disabled={isEdit}
            />
            {loadingCnpj && (
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
            placeholder="Inscrição Estadual"
            value={data.inscricaoEstadual}
            onChange={(e) => onChange('inscricaoEstadual', e.target.value)}
          />
        </div>

        <div>
          <label className="field-label">Inscrição Suframa</label>
          <input
            className="field-input"
            placeholder="Suframa"
            value={data.suframa}
            onChange={(e) => onChange('suframa', e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
        <div>
          <label className="field-label">Nome Empresarial</label>
          <input
            className="field-input"
            placeholder="Razão Social"
            value={data.razaoSocial}
            onChange={(e) => onChange('razaoSocial', e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 pb-1">
          <label className="field-label whitespace-nowrap mb-0">Optante Simples Nacional</label>
          <div className="flex items-center gap-0">
            <button
              type="button"
              className={`px-2 py-1 text-xs rounded-l-md border transition-colors ${
                data.opcaoPeloSimples === 'true'
                  ? 'bg-[hsl(144,72%,28%)] text-white border-[hsl(144,72%,28%)]'
                  : 'bg-muted text-muted-foreground border-border hover:bg-accent'
              }`}
              onClick={() => handleSimplesChange('true')}
            >
              Sim
            </button>
            <button
              type="button"
              className={`px-2 py-1 text-xs rounded-r-md border border-l-0 transition-colors ${
                data.opcaoPeloSimples === 'false'
                  ? 'bg-destructive text-destructive-foreground border-destructive'
                  : 'bg-muted text-muted-foreground border-border hover:bg-accent'
              }`}
              onClick={() => handleSimplesChange('false')}
            >
              Não
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="field-label">Situação Cadastral</label>
          <input
            className="field-input"
            placeholder="Ex: ATIVA"
            value={data.situacaoCadastral}
            onChange={(e) => onChange('situacaoCadastral', e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Data Situação Cadastral</label>
          <input
            className="field-input"
            type="date"
            value={data.dataSituacaoCadastral}
            onChange={(e) => onChange('dataSituacaoCadastral', e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Data Início Atividade</label>
          <input
            className="field-input"
            type="date"
            value={data.dataInicioAtividade}
            onChange={(e) => onChange('dataInicioAtividade', e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="field-label">Porte</label>
          <input
            className="field-input"
            placeholder="Ex: ME"
            value={data.porte}
            onChange={(e) => onChange('porte', e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Natureza Jurídica</label>
          <input
            className="field-input"
            placeholder="Ex: Sociedade Empresária Limitada"
            value={data.naturezaJuridica}
            onChange={(e) => onChange('naturezaJuridica', e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Capital Social</label>
          <input
            className="field-input"
            placeholder="Ex: 100000,00"
            value={data.capitalSocial}
            onChange={(e) => onChange('capitalSocial', e.target.value)}
          />
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
              onChange={(e) => onCepChange(e.target.value)}
              maxLength={9}
            />
            {cepHint && <p className="text-xs text-muted-foreground mt-1">{cepHint}</p>}
            {cepLoading && <Loader2 className="w-4 h-4 animate-spin text-primary mt-2" />}
            {cepError && <p className="text-xs text-destructive mt-1">{cepError}</p>}
          </div>
          <div>
            <label className="field-label">Logradouro</label>
            <input
              className="field-input"
              placeholder="Rua, Av., etc."
              value={data.endereco}
              onChange={(e) => onChange('endereco', e.target.value)}
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
              value={data.cidade && data.uf ? `${data.cidade} - ${data.uf}` : ''}
              onChange={(e) => {
                const [cidade, uf] = e.target.value.split('-').map((v) => v.trim());
                onChange('cidade', cidade || '');
                onChange('uf', (uf || '').toUpperCase());
              }}
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
            />
          </div>
          <div>
            <label className="field-label">Telefone</label>
            <input
              className="field-input"
              placeholder="(00) 0000-0000"
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
