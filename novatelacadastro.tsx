import React, { useState, useRef } from 'react';
import { Search, Building2, MapPin, Phone, CheckCircle, XCircle, Loader2, ArrowLeft, Calendar, FileText } from 'lucide-react';
import { formatCNPJ, validateCNPJ } from '@/utils/validators';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface CNPJResult {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  situacao_cadastral: string;
  data_situacao_cadastral: string;
  data_inicio_atividade: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  ddd_telefone_1: string;
  email: string;
  porte: string;
  natureza_juridica: string;
  capital_social: number;
  opcao_pelo_simples: boolean | null;
  data_opcao_pelo_simples: string | null;
  data_exclusao_do_simples: string | null;
  opcao_pelo_mei: boolean | null;
}

const ConsultaCNPJ: React.FC = () => {
  const [cnpjInput, setCnpjInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CNPJResult | null>(null);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (value: string) => {
    setCnpjInput(formatCNPJ(value));
  };

  const handleSearch = async () => {
    const cleaned = cnpjInput.replace(/\D/g, '');
    if (cleaned.length !== 14) {
      toast.error('Digite um CNPJ completo com 14 dígitos.');
      return;
    }
    if (!validateCNPJ(cleaned)) {
      toast.error('CNPJ inválido. Verifique o número.');
      return;
    }

    setLoading(true);
    setResult(null);
    setSearched(true);

    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
      if (!res.ok) throw new Error('CNPJ não encontrado');
      const data: CNPJResult = await res.json();
      setResult(data);
    } catch {
      toast.error('Não foi possível consultar o CNPJ. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const simplesStatus = result?.opcao_pelo_simples;
  const meiStatus = result?.opcao_pelo_mei;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-foreground">Consulta CNPJ</h1>
            <p className="text-xs text-muted-foreground">Verificação de enquadramento fiscal</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Search */}
        <div className="section-card">
          <label className="field-label">Informe o CNPJ</label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              className="field-input flex-1"
              placeholder="00.000.000/0000-00"
              value={cnpjInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={18}
              inputMode="numeric"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="btn-primary flex items-center gap-2 shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Consultar
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="section-card flex flex-col items-center py-10 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Consultando CNPJ...</p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            {/* Simples Nacional Card */}
            <div className={`section-card border-2 ${
              simplesStatus === true
                ? 'border-success/40 bg-success/5'
                : simplesStatus === false
                  ? 'border-destructive/40 bg-destructive/5'
                  : 'border-warning/40 bg-warning/5'
            }`}>
              <div className="flex items-start gap-3">
                {simplesStatus === true ? (
                  <CheckCircle className="w-6 h-6 text-success shrink-0 mt-0.5" />
                ) : simplesStatus === false ? (
                  <XCircle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
                ) : (
                  <FileText className="w-6 h-6 text-warning shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="font-semibold text-foreground text-sm">
                    Simples Nacional
                  </h3>
                  <p className={`text-sm font-medium ${
                    simplesStatus === true ? 'text-success' : simplesStatus === false ? 'text-destructive' : 'text-warning'
                  }`}>
                    {simplesStatus === true
                      ? 'Optante pelo Simples Nacional'
                      : simplesStatus === false
                        ? 'Não optante pelo Simples Nacional'
                        : 'Informação não disponível'}
                  </p>
                  {result.data_opcao_pelo_simples && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Opção desde: {formatDate(result.data_opcao_pelo_simples)}
                    </p>
                  )}
                  {result.data_exclusao_do_simples && (
                    <p className="text-xs text-muted-foreground">
                      Exclusão em: {formatDate(result.data_exclusao_do_simples)}
                    </p>
                  )}
                </div>
              </div>

              {/* MEI */}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  {meiStatus === true ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm text-foreground">
                    MEI: {meiStatus === true ? 'Sim' : meiStatus === false ? 'Não' : 'Indisponível'}
                  </span>
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="section-card">
              <h2 className="section-title">
                <Building2 className="w-5 h-5 text-primary" />
                Dados da Empresa
              </h2>
              <div className="space-y-3">
                <InfoRow label="Razão Social" value={result.razao_social} />
                <InfoRow label="Nome Fantasia" value={result.nome_fantasia || '—'} />
                <InfoRow label="CNPJ" value={formatCNPJ(result.cnpj)} />
                <InfoRow
                  label="Situação Cadastral"
                  value={result.situacao_cadastral}
                  highlight={result.situacao_cadastral === 'ATIVA' ? 'success' : 'destructive'}
                />
                <InfoRow label="Natureza Jurídica" value={result.natureza_juridica} />
                <InfoRow label="Porte" value={result.porte} />
                <InfoRow label="Capital Social" value={formatCurrency(result.capital_social)} />
                <InfoRow label="CNAE Principal" value={`${result.cnae_fiscal} — ${result.cnae_fiscal_descricao}`} />
                <InfoRow label="Início Atividade" value={formatDate(result.data_inicio_atividade)} />
              </div>
            </div>

            {/* Address */}
            <div className="section-card">
              <h2 className="section-title">
                <MapPin className="w-5 h-5 text-primary" />
                Endereço
              </h2>
              <div className="space-y-3">
                <InfoRow label="Logradouro" value={`${result.logradouro}, ${result.numero}`} />
                {result.complemento && <InfoRow label="Complemento" value={result.complemento} />}
                <InfoRow label="Bairro" value={result.bairro} />
                <InfoRow label="Município / UF" value={`${result.municipio} — ${result.uf}`} />
                <InfoRow label="CEP" value={result.cep} />
              </div>
            </div>

            {/* Contact */}
            {(result.ddd_telefone_1 || result.email) && (
              <div className="section-card">
                <h2 className="section-title">
                  <Phone className="w-5 h-5 text-primary" />
                  Contato
                </h2>
                <div className="space-y-3">
                  {result.ddd_telefone_1 && <InfoRow label="Telefone" value={result.ddd_telefone_1} />}
                  {result.email && <InfoRow label="E-mail" value={result.email.toLowerCase()} />}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {searched && !result && !loading && (
          <div className="section-card flex flex-col items-center py-10 gap-3 text-center">
            <XCircle className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhum resultado encontrado para este CNPJ.</p>
          </div>
        )}

        {/* Initial state */}
        {!searched && (
          <div className="section-card flex flex-col items-center py-10 gap-3 text-center">
            <Search className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Digite um CNPJ para consultar os dados cadastrais e o enquadramento no Simples Nacional.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
  highlight?: 'success' | 'destructive';
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, highlight }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={`text-sm font-medium ${
      highlight === 'success'
        ? 'text-success'
        : highlight === 'destructive'
          ? 'text-destructive'
          : 'text-foreground'
    }`}>
      {value}
    </span>
  </div>
);

export default ConsultaCNPJ;
