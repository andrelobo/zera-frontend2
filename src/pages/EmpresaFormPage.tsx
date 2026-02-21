import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { empresasApi } from '@/services/api';
import { formatCep, lookupCep, normalizeCep } from '@/services/cep';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Building2, FileText, Loader2, MapPin, Phone, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import LoadingState from '@/components/LoadingState';

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
  const date = new Date(value);
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
    endereco: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', cep: '', telefone: '', email: '',
  });

  useEffect(() => {
    if (existing) {
      const legacy = existing as Record<string, unknown>;
      const endereco = (existing.endereco || {}) as Record<string, unknown>;
      setForm({
        razaoSocial: existing.razaoSocial || String(legacy.razao_social || ''),
        cnpj: existing.cnpj,
        nomeFantasia: existing.nomeFantasia || String(legacy.nome_fantasia || ''),
        inscricaoMunicipal: existing.inscricaoMunicipal || String(legacy.inscricao_municipal || ''),
        situacaoCadastral: existing.situacaoCadastral || String(legacy.situacao_cadastral || ''),
        dataSituacaoCadastral: toDateInputValue(existing.dataSituacaoCadastral || (legacy.data_situacao_cadastral as string | undefined)),
        dataInicioAtividade: toDateInputValue(existing.dataInicioAtividade || (legacy.data_inicio_atividade as string | undefined)),
        cnaeFiscal: String(existing.cnaeFiscal || legacy.cnae_fiscal || ''),
        cnaeFiscalDescricao: existing.cnaeFiscalDescricao || String(legacy.cnae_fiscal_descricao || ''),
        porte: existing.porte || String(legacy.porte || ''),
        naturezaJuridica: existing.naturezaJuridica || String(legacy.natureza_juridica || ''),
        capitalSocial: String(existing.capitalSocial || legacy.capital_social || ''),
        opcaoPeloSimples: toBooleanSelectValue(existing.opcaoPeloSimples ?? (legacy.opcao_pelo_simples as boolean | null | undefined)),
        opcaoPeloMei: toBooleanSelectValue(existing.opcaoPeloMei ?? (legacy.opcao_pelo_mei as boolean | null | undefined)),
        dataOpcaoPeloSimples: toDateInputValue(existing.dataOpcaoPeloSimples ?? (legacy.data_opcao_pelo_simples as string | null | undefined)),
        dataExclusaoDoSimples: toDateInputValue(existing.dataExclusaoDoSimples ?? (legacy.data_exclusao_do_simples as string | null | undefined)),
        endereco: String(existing.endereco?.logradouro || endereco.logradouro || ''),
        numero: String(existing.endereco?.numero || endereco.numero || ''),
        complemento: String(existing.endereco?.complemento || endereco.complemento || ''),
        bairro: String(existing.endereco?.bairro || endereco.bairro || ''),
        cidade: existing.cidade || existing.endereco?.cidade || existing.endereco?.descricaoCidade || String(endereco.municipio || ''),
        uf: existing.uf || existing.endereco?.uf || existing.endereco?.estado || '',
        cep: formatCep(existing.cep || existing.endereco?.cep || String(endereco.cep || '')),
        telefone: existing.telefone || existing.fone || String(legacy.ddd_telefone_1 || ''),
        email: existing.email || String(legacy.email || ''),
      });
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

  const update = (key: keyof EmpresaFormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  if (isEdit && isLoading) return <LoadingState />;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Razão Social</Label>
              <Input value={form.razaoSocial} onChange={e => update('razaoSocial', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={e => update('cnpj', e.target.value)} required placeholder="00.000.000/0000-00" disabled={isEdit} />
            </div>
            <div className="space-y-2">
              <Label>Nome Fantasia</Label>
              <Input value={form.nomeFantasia} onChange={e => update('nomeFantasia', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Inscrição Municipal</Label>
              <Input value={form.inscricaoMunicipal} onChange={e => update('inscricaoMunicipal', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Situação Cadastral</Label>
              <Input value={form.situacaoCadastral} onChange={e => update('situacaoCadastral', e.target.value)} placeholder="ATIVA" />
            </div>
            <div className="space-y-2">
              <Label>Data Situação Cadastral</Label>
              <Input type="date" value={form.dataSituacaoCadastral} onChange={e => update('dataSituacaoCadastral', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Início de Atividade</Label>
              <Input type="date" value={form.dataInicioAtividade} onChange={e => update('dataInicioAtividade', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CNAE Fiscal</Label>
              <Input value={form.cnaeFiscal} onChange={e => update('cnaeFiscal', e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Descrição CNAE</Label>
              <Input value={form.cnaeFiscalDescricao} onChange={e => update('cnaeFiscalDescricao', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Porte</Label>
              <Input value={form.porte} onChange={e => update('porte', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Natureza Jurídica</Label>
              <Input value={form.naturezaJuridica} onChange={e => update('naturezaJuridica', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Capital Social</Label>
              <Input value={form.capitalSocial} onChange={e => update('capitalSocial', e.target.value)} placeholder="0,00" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Enquadramento Fiscal
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Optante pelo Simples</Label>
              <select
                value={form.opcaoPeloSimples}
                onChange={e => update('opcaoPeloSimples', e.target.value as EmpresaFormData['opcaoPeloSimples'])}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">Não informado</option>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Optante pelo MEI</Label>
              <select
                value={form.opcaoPeloMei}
                onChange={e => update('opcaoPeloMei', e.target.value as EmpresaFormData['opcaoPeloMei'])}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">Não informado</option>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Data Opção Simples</Label>
              <Input type="date" value={form.dataOpcaoPeloSimples} onChange={e => update('dataOpcaoPeloSimples', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data Exclusão Simples</Label>
              <Input type="date" value={form.dataExclusaoDoSimples} onChange={e => update('dataExclusaoDoSimples', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input
                value={form.cep}
                onChange={e => update('cep', formatCep(e.target.value))}
                placeholder="00000-000"
                inputMode="numeric"
              />
              {cepDigits.length > 0 && cepDigits.length < 8 && (
                <p className="text-xs text-muted-foreground">Informe os 8 dígitos do CEP.</p>
              )}
              {cepLookupQuery.isFetching && (
                <p className="text-xs text-muted-foreground">Buscando endereço pelo CEP...</p>
              )}
              {cepLookupQuery.isError && (
                <p className="text-xs text-destructive">
                  {cepLookupQuery.error instanceof Error ? cepLookupQuery.error.message : 'Falha ao consultar CEP.'}
                </p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Endereço</Label>
              <Input value={form.endereco} onChange={e => update('endereco', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input value={form.numero} onChange={e => update('numero', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input value={form.complemento} onChange={e => update('complemento', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input value={form.bairro} onChange={e => update('bairro', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={form.cidade} onChange={e => update('cidade', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>UF</Label>
              <Input value={form.uf} onChange={e => update('uf', e.target.value)} maxLength={2} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={e => update('telefone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} />
            </div>
          </CardContent>
        </Card>

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
