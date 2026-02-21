import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { empresasApi } from '@/services/api';
import { formatCep, lookupCep, normalizeCep } from '@/services/cep';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import LoadingState from '@/components/LoadingState';
import PrestadorSection from '@/components/PrestadorSection';
import RegimeEParametrosSection from '@/components/RegimeEParametrosSection';
import type { Empresa } from '@/types/api';

interface EmpresaFormData {
  razaoSocial: string;
  cnpj: string;
  nomeFantasia: string;
  inscricaoMunicipal: string;
  situacaoCadastral: string;
  dataSituacaoCadastral: string;
  dataInicioAtividade: string;
  cnaeFiscal: string;
  cnaeFiscalDescricao: string;
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
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
}

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

const mapEmpresaToForm = (empresa: Empresa, previous: EmpresaFormData): EmpresaFormData => {
  const legacy = empresa as Record<string, unknown>;
  const endereco = (empresa.endereco || {}) as Record<string, unknown>;

  return {
    razaoSocial: empresa.razaoSocial || String(legacy.razao_social || previous.razaoSocial),
    cnpj: empresa.cnpj || previous.cnpj,
    nomeFantasia: empresa.nomeFantasia || String(legacy.nome_fantasia || previous.nomeFantasia),
    inscricaoMunicipal: empresa.inscricaoMunicipal || String(legacy.inscricao_municipal || previous.inscricaoMunicipal),
    situacaoCadastral: empresa.situacaoCadastral || String(legacy.situacao_cadastral || previous.situacaoCadastral),
    dataSituacaoCadastral: toDateInputValue(empresa.dataSituacaoCadastral || (legacy.data_situacao_cadastral as string | undefined)) || previous.dataSituacaoCadastral,
    dataInicioAtividade: toDateInputValue(empresa.dataInicioAtividade || (legacy.data_inicio_atividade as string | undefined)) || previous.dataInicioAtividade,
    cnaeFiscal: String(empresa.cnaeFiscal || legacy.cnae_fiscal || previous.cnaeFiscal),
    cnaeFiscalDescricao: empresa.cnaeFiscalDescricao || String(legacy.cnae_fiscal_descricao || previous.cnaeFiscalDescricao),
    porte: empresa.porte || String(legacy.porte || previous.porte),
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
    endereco: String(empresa.endereco?.logradouro || endereco.logradouro || previous.endereco),
    numero: String(empresa.endereco?.numero || endereco.numero || previous.numero),
    complemento: String(empresa.endereco?.complemento || endereco.complemento || previous.complemento),
    bairro: String(empresa.endereco?.bairro || endereco.bairro || previous.bairro),
    cidade: empresa.cidade || empresa.endereco?.cidade || empresa.endereco?.descricaoCidade || String(endereco.municipio || previous.cidade),
    uf: empresa.uf || empresa.endereco?.uf || empresa.endereco?.estado || previous.uf,
    cep: formatCep(empresa.cep || empresa.endereco?.cep || String(endereco.cep || previous.cep)),
    telefone: empresa.telefone || empresa.fone || String(legacy.ddd_telefone_1 || previous.telefone),
    email: empresa.email || String(legacy.email || previous.email),
  };
};

const EmpresaFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existing, isLoading } = useQuery({
    queryKey: ['empresa', id],
    queryFn: () => empresasApi.getById(id!),
    enabled: isEdit,
  });

  const [form, setForm] = useState<EmpresaFormData>({
    razaoSocial: '', cnpj: '', nomeFantasia: '', inscricaoMunicipal: '',
    situacaoCadastral: '', dataSituacaoCadastral: '', dataInicioAtividade: '',
    cnaeFiscal: '', cnaeFiscalDescricao: '', porte: '', naturezaJuridica: '', capitalSocial: '',
    opcaoPeloSimples: '', opcaoPeloMei: '', dataOpcaoPeloSimples: '', dataExclusaoDoSimples: '',
    regimeTributario: '', aliquotaSimplesNacional: '', apuracaoSimplesNacional: '',
    endereco: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', cep: '', telefone: '', email: '',
  });
  const [lastPreviewCnpj, setLastPreviewCnpj] = useState('');
  const [lastPreviewAttemptCnpj, setLastPreviewAttemptCnpj] = useState('');

  useEffect(() => {
    if (existing) {
      setForm((prev) => mapEmpresaToForm(existing, prev));
    }
  }, [existing]);

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
        situacaoCadastral: form.situacaoCadastral || undefined,
        dataSituacaoCadastral: form.dataSituacaoCadastral || undefined,
        dataInicioAtividade: form.dataInicioAtividade || undefined,
        cnaeFiscal: form.cnaeFiscal || undefined,
        cnaeFiscalDescricao: form.cnaeFiscalDescricao || undefined,
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
        telefone: form.telefone || undefined,
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
      situacaoCadastral: payload.situacaoCadastral,
      dataSituacaoCadastral: payload.dataSituacaoCadastral,
      dataInicioAtividade: payload.dataInicioAtividade,
      cnaeFiscal: payload.cnaeFiscal,
      cnaeFiscalDescricao: payload.cnaeFiscalDescricao,
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

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/empresas')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{isEdit ? 'Editar Empresa' : 'Nova Empresa'}</h1>
      </div>

      <Alert>
        <AlertDescription>
          Empresas já cadastradas continuam operando normalmente. O certificado digital é exigido apenas no momento da emissão de NFSe.
        </AlertDescription>
      </Alert>

      <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <PrestadorSection
          data={{
            razaoSocial: form.razaoSocial,
            nomeFantasia: form.nomeFantasia,
            cnpj: form.cnpj,
            inscricaoMunicipal: form.inscricaoMunicipal,
            opcaoPeloSimples: form.opcaoPeloSimples,
            cep: form.cep,
            endereco: form.endereco,
            numero: form.numero,
            complemento: form.complemento,
            bairro: form.bairro,
            cidade: form.cidade,
            uf: form.uf,
            email: form.email,
            telefone: form.telefone,
          }}
          isEdit={isEdit}
          loadingCnpj={previewMutation.isPending}
          onAutocompleteByCnpj={handleAutocompleteByCnpj}
          onChange={(field, value) => update(field as keyof EmpresaFormData, value)}
          onCepChange={(value) => update('cep', formatCep(value))}
          cepHint={cepDigits.length > 0 && cepDigits.length < 8 ? 'Informe os 8 dígitos do CEP.' : undefined}
          cepLoading={cepLookupQuery.isFetching}
          cepError={cepLookupQuery.isError
            ? cepLookupQuery.error instanceof Error
              ? cepLookupQuery.error.message
              : 'Falha ao consultar CEP.'
            : undefined}
        />

        <div className="section-card">
          <h2 className="section-title">Dados Complementares</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="field-label">Situação Cadastral</Label>
              <Input value={form.situacaoCadastral} onChange={e => update('situacaoCadastral', e.target.value)} placeholder="ATIVA" />
            </div>
            <div className="space-y-2">
              <Label className="field-label">Data Situação Cadastral</Label>
              <Input type="date" value={form.dataSituacaoCadastral} onChange={e => update('dataSituacaoCadastral', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="field-label">Início de Atividade</Label>
              <Input type="date" value={form.dataInicioAtividade} onChange={e => update('dataInicioAtividade', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="field-label">CNAE Fiscal</Label>
              <Input value={form.cnaeFiscal} onChange={e => update('cnaeFiscal', e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="field-label">Descrição CNAE</Label>
              <Input value={form.cnaeFiscalDescricao} onChange={e => update('cnaeFiscalDescricao', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="field-label">Porte</Label>
              <Input value={form.porte} onChange={e => update('porte', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="field-label">Natureza Jurídica</Label>
              <Input value={form.naturezaJuridica} onChange={e => update('naturezaJuridica', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="field-label">Capital Social</Label>
              <Input value={form.capitalSocial} onChange={e => update('capitalSocial', e.target.value)} placeholder="0,00" />
            </div>
          </div>
        </div>

        <RegimeEParametrosSection
          regimeTributario={form.regimeTributario}
          aliquotaSimplesNacional={form.aliquotaSimplesNacional}
          apuracaoSimplesNacional={form.apuracaoSimplesNacional}
          opcaoPeloSimples={form.opcaoPeloSimples}
          opcaoPeloMei={form.opcaoPeloMei}
          dataOpcaoPeloSimples={form.dataOpcaoPeloSimples}
          dataExclusaoDoSimples={form.dataExclusaoDoSimples}
          onChange={(field, value) => update(field as keyof EmpresaFormData, value)}
        />

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
