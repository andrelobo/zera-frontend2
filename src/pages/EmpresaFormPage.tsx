import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { empresasApi } from '@/services/api';
import { formatCep, lookupCep, normalizeCep } from '@/services/cep';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, Landmark, Loader2, Save, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import LoadingState from '@/components/LoadingState';
import RegimeEParametrosSection, { type RegimeTributario as RegimeTributarioTela } from '@/components/RegimeEParametrosSection';
import CTNSection, { type CnaeAdicionado } from '@/components/CTNSection';
import SimplesNacionalSection from '@/components/SimplesNacionalSection';
import CNAESection, { type CNAEAtividade } from '@/components/CNAESection';
import TabelaAnexoIII from '@/components/TabelaAnexoIII';
import EmpresaCard from '@/components/prestador/EmpresaCard';
import EnderecoCard from '@/components/prestador/EnderecoCard';
import ContatoCard from '@/components/prestador/ContatoCard';
import { calcularSimplesAnexoIII } from '@/utils/simples-nacional';
import { getLC116Item } from '@/utils/cnae-lc116';
import type { Empresa } from '@/types/api';

interface EmpresaFormData {
  razaoSocial: string;
  cnpj: string;
  nomeFantasia: string;
  inscricaoMunicipal: string;
  inscricaoEstadual: string;
  suframa: string;
  situacaoCadastral: string;
  dataSituacaoCadastral: string;
  dataInicioAtividade: string;
  cnaeFiscal: string;
  cnaeFiscalDescricao: string;
  ctnCodigo: string;
  nbsCodigo: string;
  porte: string;
  naturezaJuridica: string;
  capitalSocial: string;
  opcaoPeloSimples: '' | 'true' | 'false';
  opcaoPeloMei: '' | 'true' | 'false';
  dataOpcaoPeloSimples: string;
  dataExclusaoDoSimples: string;
  regimeTributario: '' | 'simples_nacional' | 'lucro_presumido' | 'lucro_real';
  aliquotaSimplesNacional: string;
  apuracaoSimplesNacional: string;
  rbt12: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
  whatsapp: string;
  email: string;
}

type PrestadorSubTab = 'cadastro' | 'regime' | 'parametros';

const PRESTADOR_SUB_TABS: Array<{
  key: PrestadorSubTab;
  label: string;
  icon: typeof Building2;
}> = [
  { key: 'cadastro', label: 'Dados Cadastrais', icon: Building2 },
  { key: 'regime', label: 'Regime Tributário', icon: Landmark },
  { key: 'parametros', label: 'Parâmetros Fiscais', icon: Settings },
];

const ToggleSwitch = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) => (
  <label className="flex items-center gap-3 cursor-pointer select-none">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`switch-track ${checked ? 'switch-track-on' : 'switch-track-off'}`}
    >
      <span className={`switch-thumb ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
    <span className="text-sm text-foreground">{label}</span>
  </label>
);

const toDateInputValue = (value?: string | null) => {
  if (!value) return '';
  const trimmed = value.trim();
  const brDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  const normalized = brDate ? `${brDate[3]}-${brDate[2]}-${brDate[1]}` : trimmed;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const toBooleanSelectValue = (value?: boolean | null) => {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return '';
};

const fromBooleanSelectValue = (value: string): boolean | null | undefined => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const toTelaRegime = (regime: EmpresaFormData['regimeTributario']): RegimeTributarioTela => {
  if (regime === 'simples_nacional') return 'simples';
  if (regime === 'lucro_presumido') return 'presumido';
  if (regime === 'lucro_real') return 'real';
  return null;
};

const fromTelaRegime = (regime: RegimeTributarioTela): EmpresaFormData['regimeTributario'] => {
  if (regime === 'simples') return 'simples_nacional';
  if (regime === 'presumido') return 'lucro_presumido';
  if (regime === 'real') return 'lucro_real';
  return '';
};

const formatCnpj = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

const mapEmpresaToForm = (empresa: Empresa, previous: EmpresaFormData): EmpresaFormData => {
  const legacy = empresa as Record<string, unknown>;
  const endereco = (empresa.endereco || {}) as Record<string, unknown>;
  const providerData = (legacy.providerData as Record<string, unknown> | undefined) ?? {};
  const atividadePrincipal = Array.isArray(providerData.atividade_principal)
    ? (providerData.atividade_principal[0] as Record<string, unknown> | undefined)
    : undefined;
  const simplesData = (providerData.simples as Record<string, unknown> | undefined) ?? {};

  const hasSimples = (
    empresa.opcaoPeloSimples === true
    || legacy.opcao_pelo_simples === true
    || providerData.opcao_pelo_simples === true
    || simplesData.optante === true
  );

  return {
    razaoSocial: empresa.razaoSocial || String(legacy.razao_social || previous.razaoSocial),
    cnpj: empresa.cnpj || previous.cnpj,
    nomeFantasia: empresa.nomeFantasia || String(legacy.nome_fantasia || previous.nomeFantasia),
    inscricaoMunicipal: empresa.inscricaoMunicipal || String(legacy.inscricao_municipal || previous.inscricaoMunicipal),
    inscricaoEstadual: empresa.inscricaoEstadual || String(legacy.inscricao_estadual || previous.inscricaoEstadual),
    suframa: empresa.suframa || String(legacy.suframa || previous.suframa),
    situacaoCadastral: empresa.situacaoCadastral || String(legacy.situacao_cadastral || previous.situacaoCadastral),
    dataSituacaoCadastral: toDateInputValue(
      empresa.dataSituacaoCadastral
      || (legacy.data_situacao_cadastral as string | undefined)
      || (providerData.data_situacao_cadastral as string | undefined),
    ) || previous.dataSituacaoCadastral,
    dataInicioAtividade: toDateInputValue(
      empresa.dataInicioAtividade
      || (legacy.data_inicio_atividade as string | undefined)
      || (providerData.data_inicio_atividade as string | undefined),
    ) || previous.dataInicioAtividade,
    cnaeFiscal: String(
      empresa.cnaeFiscal
      || legacy.cnae_fiscal
      || providerData.cnae_fiscal
      || previous.cnaeFiscal,
    ),
    cnaeFiscalDescricao: empresa.cnaeFiscalDescricao
      || String(
        legacy.cnae_fiscal_descricao
        || providerData.cnae_fiscal_descricao
        || atividadePrincipal?.descricao
        || previous.cnaeFiscalDescricao,
      ),
    ctnCodigo: String(
      legacy.ctnCodigo
      || legacy.ctn_codigo
      || providerData.ctn_codigo
      || previous.ctnCodigo,
    ),
    nbsCodigo: String(
      legacy.nbsCodigo
      || legacy.nbs_codigo
      || providerData.nbs_codigo
      || previous.nbsCodigo,
    ),
    porte: empresa.porte
      || String(providerData.descricao_porte || legacy.porte || providerData.porte || previous.porte),
    naturezaJuridica: empresa.naturezaJuridica || String(legacy.natureza_juridica || previous.naturezaJuridica),
    capitalSocial: String(empresa.capitalSocial || legacy.capital_social || previous.capitalSocial),
    opcaoPeloSimples: toBooleanSelectValue(
      empresa.opcaoPeloSimples ?? (legacy.opcao_pelo_simples as boolean | null | undefined),
    ) || previous.opcaoPeloSimples,
    opcaoPeloMei: toBooleanSelectValue(
      empresa.opcaoPeloMei ?? (legacy.opcao_pelo_mei as boolean | null | undefined),
    ) || previous.opcaoPeloMei,
    dataOpcaoPeloSimples: toDateInputValue(
      empresa.dataOpcaoPeloSimples ?? (legacy.data_opcao_pelo_simples as string | null | undefined),
    ) || previous.dataOpcaoPeloSimples,
    dataExclusaoDoSimples: toDateInputValue(
      empresa.dataExclusaoDoSimples ?? (legacy.data_exclusao_do_simples as string | null | undefined),
    ) || previous.dataExclusaoDoSimples,
    regimeTributario: (
      empresa as unknown as { regimeTributario?: EmpresaFormData['regimeTributario'] }
    ).regimeTributario
      || (legacy.regime_tributario as EmpresaFormData['regimeTributario'] | undefined)
      || (hasSimples ? 'simples_nacional' : undefined)
      || previous.regimeTributario,
    aliquotaSimplesNacional:
      String(
        empresa.aliquotaSimplesNacional
          || (legacy.aliquota_simples_nacional as string | undefined)
          || previous.aliquotaSimplesNacional,
      ),
    apuracaoSimplesNacional:
      String(
        empresa.apuracaoSimplesNacional
          || (legacy.apuracao_simples_nacional as string | undefined)
          || previous.apuracaoSimplesNacional,
      ),
    rbt12: String(
      legacy.rbt12
      || providerData.rbt12
      || previous.rbt12,
    ),
    endereco: String(empresa.endereco?.logradouro || endereco.logradouro || previous.endereco),
    numero: String(empresa.endereco?.numero || endereco.numero || previous.numero),
    complemento: String(empresa.endereco?.complemento || endereco.complemento || previous.complemento),
    bairro: String(empresa.endereco?.bairro || endereco.bairro || previous.bairro),
    cidade: empresa.cidade || empresa.endereco?.cidade || empresa.endereco?.descricaoCidade || String(endereco.municipio || previous.cidade),
    uf: empresa.uf || empresa.endereco?.uf || empresa.endereco?.estado || previous.uf,
    cep: formatCep(empresa.cep || empresa.endereco?.cep || String(endereco.cep || previous.cep)),
    telefone: empresa.telefone || empresa.fone || empresa.whatsapp || String(legacy.ddd_telefone_1 || previous.telefone),
    whatsapp: empresa.whatsapp || empresa.telefone || empresa.fone || String(legacy.ddd_telefone_1 || previous.whatsapp),
    email: empresa.email || String(legacy.email || previous.email),
  };
};

const EmpresaFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existing, isLoading } = useQuery({
    queryKey: ['empresa', id],
    queryFn: () => empresasApi.getById(id!),
    enabled: isEdit,
  });

  const [form, setForm] = useState<EmpresaFormData>({
    razaoSocial: '', cnpj: '', nomeFantasia: '', inscricaoMunicipal: '', inscricaoEstadual: '', suframa: '',
    situacaoCadastral: '', dataSituacaoCadastral: '', dataInicioAtividade: '',
    cnaeFiscal: '', cnaeFiscalDescricao: '', ctnCodigo: '', nbsCodigo: '', porte: '', naturezaJuridica: '', capitalSocial: '',
    opcaoPeloSimples: '', opcaoPeloMei: '', dataOpcaoPeloSimples: '', dataExclusaoDoSimples: '',
    regimeTributario: '', aliquotaSimplesNacional: '', apuracaoSimplesNacional: '', rbt12: '',
    endereco: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', cep: '', telefone: '', whatsapp: '', email: '',
  });
  const initialSubTab = (() => {
    const secao = searchParams.get('secao');
    if (secao === 'regime') return 'regime';
    if (secao === 'parametros') return 'parametros';
    return 'cadastro';
  })();
  const [prestadorSubTab, setPrestadorSubTab] = useState<PrestadorSubTab>(initialSubTab);
  const [lastPreviewCnpj, setLastPreviewCnpj] = useState('');
  const [lastPreviewAttemptCnpj, setLastPreviewAttemptCnpj] = useState('');
  const [cnaesRegime, setCnaesRegime] = useState<CNAEAtividade[]>([]);
  const [cnaesParam, setCnaesParam] = useState<CnaeAdicionado[]>([]);

  useEffect(() => {
    if (existing) {
      setForm((prev) => mapEmpresaToForm(existing, prev));
    }
  }, [existing]);

  useEffect(() => {
    if (cnaesRegime.length > 0) return;
    const codigo = String(form.cnaeFiscal || '').replace(/\D/g, '');
    if (!codigo) return;
    setCnaesRegime([
      {
        codigo,
        descricao: form.cnaeFiscalDescricao || 'CNAE principal',
        isPrincipal: true,
      },
    ]);
  }, [cnaesRegime.length, form.cnaeFiscal, form.cnaeFiscalDescricao]);

  useEffect(() => {
    if (cnaesParam.length > 0) return;
    const codigo = String(form.cnaeFiscal || '').replace(/\D/g, '');
    if (!codigo) return;
    const lc = getLC116Item(codigo);
    setCnaesParam([
      {
        codigo,
        cnaeDescricao: form.cnaeFiscalDescricao || lc?.cnaeDescricao || 'CNAE principal',
        lc116Descricao: lc?.descricao || '',
        lc116Item: lc?.item || '',
        vinculos: [
          {
            id: 'initial',
            ctn: form.ctnCodigo || undefined,
            nbs: form.nbsCodigo || undefined,
          },
        ],
        isPrincipal: true,
      },
    ]);
  }, [cnaesParam.length, form.cnaeFiscal, form.cnaeFiscalDescricao, form.ctnCodigo, form.nbsCodigo]);

  useEffect(() => {
    const secao = searchParams.get('secao');
    if (secao === 'regime' || secao === 'parametros' || secao === 'cadastro') {
      setPrestadorSubTab(secao);
      return;
    }
    setPrestadorSubTab('cadastro');
  }, [searchParams]);

  const cepDigits = useMemo(() => normalizeCep(form.cep), [form.cep]);

  const cepLookupQuery = useQuery({
    queryKey: ['cep-lookup', 'empresa-form', cepDigits],
    queryFn: () => lookupCep(cepDigits),
    enabled: cepDigits.length === 8,
    staleTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    if (!cepLookupQuery.data) return;
    const address = cepLookupQuery.data;
    setForm((prev) => ({
      ...prev,
      endereco: address.logradouro || prev.endereco,
      cidade: address.cidade || prev.cidade,
      uf: address.uf || prev.uf,
      cep: formatCep(address.cep),
    }));
  }, [cepLookupQuery.data]);

  const mutation = useMutation({
    mutationFn: () => {
      const capitalSocialNumber = form.capitalSocial.trim()
        ? Number(form.capitalSocial.replace(/\./g, '').replace(',', '.'))
        : undefined;
      const payload = {
        cnpj: form.cnpj,
        razaoSocial: form.razaoSocial,
        nomeFantasia: form.nomeFantasia || undefined,
        inscricaoMunicipal: form.inscricaoMunicipal || undefined,
        inscricaoEstadual: form.inscricaoEstadual || undefined,
        suframa: form.suframa || undefined,
        situacaoCadastral: form.situacaoCadastral || undefined,
        dataSituacaoCadastral: form.dataSituacaoCadastral || undefined,
        dataInicioAtividade: form.dataInicioAtividade || undefined,
        cnaeFiscal: form.cnaeFiscal || undefined,
        cnaeFiscalDescricao: form.cnaeFiscalDescricao || undefined,
        ctnCodigo: form.ctnCodigo || undefined,
        nbsCodigo: form.nbsCodigo || undefined,
        porte: form.porte || undefined,
        naturezaJuridica: form.naturezaJuridica || undefined,
        capitalSocial: Number.isFinite(capitalSocialNumber) ? capitalSocialNumber : undefined,
        opcaoPeloSimples: fromBooleanSelectValue(form.opcaoPeloSimples),
        opcaoPeloMei: fromBooleanSelectValue(form.opcaoPeloMei),
        dataOpcaoPeloSimples: form.dataOpcaoPeloSimples || undefined,
        dataExclusaoDoSimples: form.dataExclusaoDoSimples || undefined,
        regimeTributario: form.regimeTributario || undefined,
        aliquotaSimplesNacional: form.aliquotaSimplesNacional || undefined,
        apuracaoSimplesNacional: form.apuracaoSimplesNacional || undefined,
        email: form.email || undefined,
        telefone: form.telefone || form.whatsapp || undefined,
        whatsapp: form.whatsapp || form.telefone || undefined,
        endereco: {
          logradouro: form.endereco || undefined,
          numero: form.numero || undefined,
          complemento: form.complemento || undefined,
          bairro: form.bairro || undefined,
          cidade: form.cidade || undefined,
          uf: form.uf || undefined,
          cep: normalizeCep(form.cep) || undefined,
        },
      };
      return isEdit ? empresasApi.update(id!, {
      razaoSocial: payload.razaoSocial,
      nomeFantasia: payload.nomeFantasia,
      inscricaoMunicipal: payload.inscricaoMunicipal,
      inscricaoEstadual: payload.inscricaoEstadual,
      suframa: payload.suframa,
      situacaoCadastral: payload.situacaoCadastral,
      dataSituacaoCadastral: payload.dataSituacaoCadastral,
      dataInicioAtividade: payload.dataInicioAtividade,
      cnaeFiscal: payload.cnaeFiscal,
      cnaeFiscalDescricao: payload.cnaeFiscalDescricao,
      ctnCodigo: payload.ctnCodigo,
      nbsCodigo: payload.nbsCodigo,
      porte: payload.porte,
      naturezaJuridica: payload.naturezaJuridica,
      capitalSocial: payload.capitalSocial,
      opcaoPeloSimples: payload.opcaoPeloSimples,
      opcaoPeloMei: payload.opcaoPeloMei,
      dataOpcaoPeloSimples: payload.dataOpcaoPeloSimples,
      dataExclusaoDoSimples: payload.dataExclusaoDoSimples,
      regimeTributario: payload.regimeTributario,
      aliquotaSimplesNacional: payload.aliquotaSimplesNacional,
      apuracaoSimplesNacional: payload.apuracaoSimplesNacional,
      email: payload.email,
      telefone: payload.telefone,
      whatsapp: payload.whatsapp,
      endereco: payload.endereco,
    }) : empresasApi.create(payload);
    },
    onSuccess: () => {
      toast({ title: isEdit ? 'Empresa atualizada' : 'Empresa criada' });
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      navigate('/empresas');
    },
  });

  const previewMutation = useMutation({
    mutationFn: (cnpj: string) => empresasApi.previewByCnpj(cnpj),
    onSuccess: (empresa) => {
      setLastPreviewCnpj(empresa.cnpj.replace(/\D/g, ''));
      setForm((prev) => mapEmpresaToForm(empresa, prev));
      toast({
        title: 'Dados preenchidos',
        description: 'Autocompletar por CNPJ concluiu o preenchimento dos campos disponíveis.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Falha ao autocompletar',
        description: error instanceof Error ? error.message : 'Não foi possível buscar dados para este CNPJ.',
        variant: 'destructive',
      });
    },
  });

  const update = (key: keyof EmpresaFormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handlePrestadorChange = (field: keyof EmpresaFormData, value: string) => {
    if (field !== 'cnpj') {
      update(field, value);
      return;
    }
    const formatted = formatCnpj(value);
    const digits = formatted.replace(/\D/g, '');
    setForm((prev) => ({ ...prev, cnpj: formatted }));
    if (digits !== lastPreviewCnpj) {
      setLastPreviewAttemptCnpj('');
    }
  };

  const handleAutocompleteByCnpj = () => {
    const cnpj = form.cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) {
      toast({
        title: 'CNPJ inválido',
        description: 'Informe um CNPJ com 14 dígitos para autocompletar.',
        variant: 'destructive',
      });
      return;
    }
    if (previewMutation.isPending || lastPreviewCnpj === cnpj) return;
    setLastPreviewAttemptCnpj(cnpj);
    previewMutation.mutate(cnpj);
  };

  useEffect(() => {
    if (isEdit) return;
    const cnpj = form.cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) return;
    if (
      previewMutation.isPending
      || lastPreviewCnpj === cnpj
      || lastPreviewAttemptCnpj === cnpj
    ) return;
    setLastPreviewAttemptCnpj(cnpj);
    previewMutation.mutate(cnpj);
  }, [form.cnpj, isEdit, lastPreviewAttemptCnpj, lastPreviewCnpj, previewMutation]);

  if (isEdit && isLoading) return <LoadingState />;

  const rbt12Number = Number(form.rbt12.replace(/\./g, '').replace(',', '.')) || 0;
  const simplesCalculo = calcularSimplesAnexoIII(rbt12Number, 'III');
  const regimeTela = toTelaRegime(form.regimeTributario);

  const handleCnaesChange = (items: CnaeAdicionado[]) => {
    setCnaesParam(items);
    const principal = items.find((item) => item.isPrincipal) || items[0];
    if (!principal) {
      return;
    }
    const primeiroVinculo = principal.vinculos[0];
    setForm((prev) => ({
      ...prev,
      cnaeFiscal: principal.codigo,
      cnaeFiscalDescricao: principal.cnaeDescricao || prev.cnaeFiscalDescricao,
      ctnCodigo: primeiroVinculo?.ctn || '',
      nbsCodigo: primeiroVinculo?.nbs || '',
    }));
  };

  const handleCnaesRegimeChange = (items: CNAEAtividade[]) => {
    setCnaesRegime(items);
    const principal = items.find((item) => item.isPrincipal) || items[0];
    if (!principal) return;

    setForm((prev) => ({
      ...prev,
      cnaeFiscal: String(principal.codigo),
      cnaeFiscalDescricao: principal.descricao || prev.cnaeFiscalDescricao,
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/empresas')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <span className="section-title-icon section-title-icon-primary">
            <Building2 className="h-4 w-4" />
          </span>
          {isEdit ? 'Editar Empresa' : 'Nova Empresa'}
        </h1>
      </div>

      <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div className="section-card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PRESTADOR_SUB_TABS.map((subTab) => (
              <button
                key={subTab.key}
                type="button"
                onClick={() => {
                  setPrestadorSubTab(subTab.key);
                  setSearchParams({ secao: subTab.key });
                }}
                className={`radio-card text-left ${
                  prestadorSubTab === subTab.key ? 'radio-card-selected' : ''
                }`}
              >
                <subTab.icon className="w-4 h-4 shrink-0 text-primary" />
                <span className="text-sm font-medium text-foreground">{subTab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {prestadorSubTab === 'cadastro' && (
          <div className="space-y-2">
            <EmpresaCard
              data={{
                cnpj: form.cnpj,
                nomeEmpresarial: form.razaoSocial,
                nomeFantasia: form.nomeFantasia,
                inscricaoMunicipal: form.inscricaoMunicipal,
                inscricaoEstadual: form.inscricaoEstadual,
                suframa: form.suframa,
              }}
              onFieldChange={(field, value) => handlePrestadorChange(field as keyof EmpresaFormData, value)}
              onCNPJChange={(value) => handlePrestadorChange('cnpj', value)}
              loadingCNPJ={previewMutation.isPending}
              simplesStatus={form.opcaoPeloSimples === 'true' ? true : form.opcaoPeloSimples === 'false' ? false : null}
              onSimplesToggle={(value) => update('opcaoPeloSimples', value ? 'true' : 'false')}
            />

            <EnderecoCard
              cep={form.cep}
              logradouro={form.endereco}
              numero={form.numero}
              complemento={form.complemento}
              bairro={form.bairro}
              localidadeUf={form.cidade && form.uf ? `${form.cidade} - ${form.uf}` : ''}
              onFieldChange={(field, value) => {
                if (field !== 'localidadeUf') {
                  handlePrestadorChange(field as keyof EmpresaFormData, value);
                  return;
                }
                const [cidade, uf] = value.split('-').map((part) => part.trim());
                update('cidade', cidade || '');
                update('uf', (uf || '').toUpperCase());
              }}
              onCEPChange={(value) => update('cep', formatCep(value))}
              loadingCEP={cepLookupQuery.isFetching}
            />

            <ContatoCard
              email={form.email}
              whatsapp={form.whatsapp}
              onFieldChange={(field, value) => handlePrestadorChange(field as keyof EmpresaFormData, value)}
            />
          </div>
        )}

        {prestadorSubTab === 'regime' && (
          <div className="space-y-4">
            <RegimeEParametrosSection
              regime={regimeTela}
              onRegimeChange={(regime) => update('regimeTributario', fromTelaRegime(regime))}
              informarAliquotaSN={form.aliquotaSimplesNacional.trim().length > 0}
              onInformarAliquotaChange={(value) => update('aliquotaSimplesNacional', value ? form.aliquotaSimplesNacional || '0,00' : '')}
              aliquotaSN={form.aliquotaSimplesNacional}
              onAliquotaSNChange={(value) => update('aliquotaSimplesNacional', value)}
              regimeApuracaoSNParametro={form.apuracaoSimplesNacional.trim().length > 0}
              onRegimeApuracaoSNParametroChange={(value) => update('apuracaoSimplesNacional', value ? 'MENSAL' : '')}
              onAutosave={() => undefined}
            />

            <CNAESection
              cnpj={form.cnpj}
              cnaeEscolhido={form.cnaeFiscal || null}
              onCnaeEscolhidoChange={(codigo, descricao) => {
                setForm((prev) => ({
                  ...prev,
                  cnaeFiscal: codigo,
                  cnaeFiscalDescricao: descricao || prev.cnaeFiscalDescricao,
                }));
              }}
              rbt12={rbt12Number}
              cnaesLista={cnaesRegime}
              onCnaesListaChange={handleCnaesRegimeChange}
            />

            {regimeTela === 'simples' && (
              <>
                <SimplesNacionalSection
                  cnaePrincipal={String(form.cnaeFiscal || '')}
                  cnaeDescricao={form.cnaeFiscalDescricao}
                  cnaeAnexo="III"
                  rbt12={rbt12Number}
                  onRbt12Change={(value) => update('rbt12', value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                  calculo={simplesCalculo}
                  alertas={simplesCalculo.alertas}
                  permiteFatorR={false}
                />
                <TabelaAnexoIII faixaAtual={simplesCalculo.faixa?.faixa ?? null} />
              </>
            )}
          </div>
        )}

        {prestadorSubTab === 'parametros' && (
          <div className="space-y-2">
            {regimeTela === 'simples' && (
              <div className="section-card p-3">
                <h2 className="section-title text-sm mb-2">
                  <Settings className="w-4 h-4 text-primary" />
                  Parâmetros Federais
                </h2>
                <div className="space-y-2 p-2.5 rounded-lg bg-muted/50 border border-border">
                  <ToggleSwitch
                    checked={form.apuracaoSimplesNacional.trim().length > 0}
                    onChange={(value) => update('apuracaoSimplesNacional', value ? 'MENSAL' : '')}
                    label="Regime de apuração dos tributos federais e municipal pelo Simples Nacional"
                  />
                  <ToggleSwitch
                    checked={form.aliquotaSimplesNacional.trim().length > 0}
                    onChange={(value) => update('aliquotaSimplesNacional', value ? '0,00' : '')}
                    label="Informar alíquota do Simples Nacional"
                  />
                  {form.aliquotaSimplesNacional.trim().length > 0 && (
                    <div>
                      <label className="field-label whitespace-nowrap">Simples Nacional</label>
                      <div className="relative w-[55px]">
                        <input
                          className="field-input pr-7 border-primary"
                          type="text"
                          placeholder="00,00"
                          maxLength={5}
                          value={form.aliquotaSimplesNacional}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
                            if (value.length > 2) value = `${value.slice(0, -2)},${value.slice(-2)}`;
                            update('aliquotaSimplesNacional', value);
                          }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!regimeTela && (
              <div className="section-card flex items-center justify-center py-8 text-muted-foreground text-sm">
                Selecione um regime tributário na aba "Regime Tributário" para configurar os parâmetros.
              </div>
            )}

            {regimeTela && regimeTela !== 'simples' && (
              <div className="section-card">
                <h2 className="section-title">
                  <Settings className="w-5 h-5 text-primary" />
                  Parâmetros Federais
                </h2>
                <p className="text-sm text-muted-foreground">
                  Configurações federais para {regimeTela === 'presumido' ? 'Lucro Presumido' : 'Lucro Real'} serão disponibilizadas em breve.
                </p>
              </div>
            )}

            <div className="section-card p-3">
              <h2 className="section-title text-sm mb-2">
                <Settings className="w-4 h-4 text-primary" />
                Parâmetros Municipais
              </h2>
              <CTNSection
                ctnSelecionado={form.ctnCodigo || null}
                onCtnChange={(codigo) => update('ctnCodigo', codigo)}
                savedCnaes={cnaesParam}
                onCnaesChange={handleCnaesChange}
                regimeCnaes={cnaesRegime}
              />
            </div>

            <div className="section-card">
              <h2 className="section-title">
                <Settings className="w-5 h-5 text-primary" />
                Configurações Operacionais
              </h2>
              <p className="text-sm text-muted-foreground py-4 text-center">
                Configurações operacionais adicionais serão disponibilizadas em versões futuras.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isEdit ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EmpresaFormPage;
