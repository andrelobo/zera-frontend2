import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingState from '@/components/LoadingState';
import TomadorSection, { type TomadorSectionData } from '@/components/TomadorSection';
import { formatCep, lookupCep, normalizeCep } from '@/services/cep';
import { empresasApi, tomadoresApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const formatDoc = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  return digits
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

const parseLocalidadeUf = (value: string) => {
  const [municipioRaw, ufRaw] = value.split('-').map((part) => part.trim());
  return {
    municipio: municipioRaw || '',
    uf: (ufRaw || '').toUpperCase(),
  };
};

const onlyDigits = (value: string) => value.replace(/\D/g, '');
const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d)(\d{4})$/, '$1-$2');
};

const preferAutofill = (current: string, next?: string) => {
  const normalizedCurrent = current.trim();
  const normalizedNext = (next || '').trim();
  if (!normalizedNext) return current;
  if (!normalizedCurrent) return normalizedNext;
  return current;
};

type AutofillTomador = {
  cpfCnpj?: string;
  razaoSocial?: string;
  inscricaoMunicipal?: string;
  inscricaoEstadual?: string;
  suframa?: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  localidadeUf?: string;
};

const mergeAutofill = (base: AutofillTomador, incoming?: AutofillTomador | null): AutofillTomador => {
  if (!incoming) return base;
  return {
    cpfCnpj: base.cpfCnpj || incoming.cpfCnpj,
    razaoSocial: base.razaoSocial || incoming.razaoSocial,
    inscricaoMunicipal: base.inscricaoMunicipal || incoming.inscricaoMunicipal,
    inscricaoEstadual: base.inscricaoEstadual || incoming.inscricaoEstadual,
    suframa: base.suframa || incoming.suframa,
    email: base.email || incoming.email,
    cep: base.cep || incoming.cep,
    logradouro: base.logradouro || incoming.logradouro,
    numero: base.numero || incoming.numero,
    complemento: base.complemento || incoming.complemento,
    bairro: base.bairro || incoming.bairro,
    localidadeUf: base.localidadeUf || incoming.localidadeUf,
  };
};

const INITIAL_FORM: TomadorSectionData = {
  empresaCnpj: '',
  cpfCnpj: '',
  razaoSocial: '',
  nomeFantasia: '',
  inscricaoMunicipal: '',
  inscricaoEstadual: '',
  suframa: '',
  substitutoTributario: false,
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  localidadeUf: '',
  email: '',
  whatsapp: '',
};

const TomadorFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TomadorSectionData>(INITIAL_FORM);
  const [fallbackEmpresaCnpj, setFallbackEmpresaCnpj] = useState('');
  const [lastAutofillDoc, setLastAutofillDoc] = useState('');

  const { data: existing, isLoading } = useQuery({
    queryKey: ['tomador', id],
    queryFn: () => tomadoresApi.getById(id!),
    enabled: isEdit,
  });

  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas', 'tomador-form'],
    queryFn: () => empresasApi.list({ limit: 1 }),
    enabled: !isEdit,
  });

  useEffect(() => {
    if (!isEdit && empresas[0]?.cnpj) {
      setFallbackEmpresaCnpj(empresas[0].cnpj.replace(/\D/g, ''));
    }
  }, [empresas, isEdit]);

  useEffect(() => {
    if (!existing) return;
    const municipio = existing.endereco?.municipio || '';
    const uf = existing.endereco?.uf || '';

    setForm({
      empresaCnpj: formatDoc(existing.empresaCnpj),
      cpfCnpj: formatDoc(existing.cpfCnpj),
      razaoSocial: existing.razaoSocial,
      nomeFantasia: '',
      inscricaoMunicipal: existing.inscricaoMunicipal || '',
      inscricaoEstadual: existing.inscricaoEstadual || '',
      suframa: existing.suframa || '',
      substitutoTributario: false,
      cep: formatCep(existing.endereco?.cep || ''),
      logradouro: existing.endereco?.logradouro || '',
      numero: existing.endereco?.numero || '',
      complemento: existing.endereco?.complemento || '',
      bairro: existing.endereco?.bairro || '',
      localidadeUf: municipio && uf ? `${municipio} - ${uf}` : municipio || '',
      email: existing.email || '',
      whatsapp: '',
    });
  }, [existing]);

  const cpfCnpjDigits = useMemo(() => onlyDigits(form.cpfCnpj), [form.cpfCnpj]);
  const isCnpjDoc = useMemo(() => cpfCnpjDigits.length === 14, [cpfCnpjDigits]);
  const empresaCnpjBase = useMemo(
    () => onlyDigits(form.empresaCnpj || fallbackEmpresaCnpj),
    [form.empresaCnpj, fallbackEmpresaCnpj],
  );

  const autofillQuery = useQuery({
    queryKey: ['tomadores', 'autofill', empresaCnpjBase, cpfCnpjDigits],
    enabled: !isEdit && empresaCnpjBase.length === 14 && cpfCnpjDigits.length >= 11,
    staleTime: 30_000,
    queryFn: async (): Promise<AutofillTomador | null> => {
      const isCnpj = cpfCnpjDigits.length === 14;
      const requests = await Promise.allSettled([
        tomadoresApi.autocomplete({
          empresaCnpj: empresaCnpjBase,
          q: cpfCnpjDigits,
          limit: 10,
        }),
        tomadoresApi.list({
          empresaCnpj: empresaCnpjBase,
          q: cpfCnpjDigits,
        }),
        isCnpj ? empresasApi.getByCnpj(cpfCnpjDigits) : Promise.resolve(null),
        isCnpj ? empresasApi.previewByCnpj(cpfCnpjDigits) : Promise.resolve(null),
      ]);

      const tomadoresAutocomplete =
        requests[0].status === 'fulfilled' ? requests[0].value : [];
      const tomadoresList =
        requests[1].status === 'fulfilled' ? requests[1].value : [];
      const empresaByCnpj =
        requests[2].status === 'fulfilled' ? requests[2].value : null;
      const empresaPreview =
        requests[3].status === 'fulfilled' ? requests[3].value : null;

      const tomadorExact =
        tomadoresAutocomplete.find((item) => onlyDigits(item.cpfCnpj) === cpfCnpjDigits)
        || tomadoresList.find((item) => onlyDigits(item.cpfCnpj) === cpfCnpjDigits);

      const fromTomador: AutofillTomador | null = tomadorExact
        ? {
          cpfCnpj: tomadorExact.cpfCnpj,
          razaoSocial: tomadorExact.razaoSocial,
          inscricaoMunicipal: tomadorExact.inscricaoMunicipal,
          inscricaoEstadual: tomadorExact.inscricaoEstadual,
          suframa: tomadorExact.suframa,
          email: tomadorExact.email,
          cep: tomadorExact.endereco?.cep,
          logradouro: tomadorExact.endereco?.logradouro,
          numero: tomadorExact.endereco?.numero,
          complemento: tomadorExact.endereco?.complemento,
          bairro: tomadorExact.endereco?.bairro,
          localidadeUf: tomadorExact.endereco?.municipio && tomadorExact.endereco?.uf
            ? `${tomadorExact.endereco.municipio} - ${tomadorExact.endereco.uf}`
            : undefined,
        }
        : null;

      const fromEmpresa: AutofillTomador | null = empresaByCnpj
        ? {
          razaoSocial: empresaByCnpj.razaoSocial,
          inscricaoMunicipal: empresaByCnpj.inscricaoMunicipal,
          inscricaoEstadual: empresaByCnpj.inscricaoEstadual,
          suframa: empresaByCnpj.suframa,
          email: empresaByCnpj.email,
          cep: empresaByCnpj.endereco?.cep,
          logradouro: empresaByCnpj.endereco?.logradouro,
          numero: empresaByCnpj.endereco?.numero,
          complemento: empresaByCnpj.endereco?.complemento,
          bairro: empresaByCnpj.endereco?.bairro,
          localidadeUf: empresaByCnpj.endereco?.cidade && empresaByCnpj.endereco?.uf
            ? `${empresaByCnpj.endereco.cidade} - ${empresaByCnpj.endereco.uf}`
            : undefined,
        }
        : null;

      const fromPreview: AutofillTomador | null = empresaPreview
        ? {
          razaoSocial: empresaPreview.razaoSocial,
          inscricaoMunicipal: empresaPreview.inscricaoMunicipal,
          inscricaoEstadual: empresaPreview.inscricaoEstadual,
          suframa: empresaPreview.suframa,
          email: empresaPreview.email,
          cep: empresaPreview.endereco?.cep,
          logradouro: empresaPreview.endereco?.logradouro,
          numero: empresaPreview.endereco?.numero,
          complemento: empresaPreview.endereco?.complemento,
          bairro: empresaPreview.endereco?.bairro,
          localidadeUf: empresaPreview.endereco?.cidade && empresaPreview.endereco?.uf
            ? `${empresaPreview.endereco.cidade} - ${empresaPreview.endereco.uf}`
            : undefined,
        }
        : null;

      const merged = mergeAutofill(
        mergeAutofill(
          mergeAutofill({}, fromTomador),
          fromEmpresa,
        ),
        fromPreview,
      );

      return Object.values(merged).some(Boolean) ? merged : null;
    },
  });

  useEffect(() => {
    if (isEdit) return;
    if (!autofillQuery.data) return;
    if (lastAutofillDoc === cpfCnpjDigits) return;

    setForm((prev) => {
      return {
        ...prev,
        cpfCnpj: formatDoc(preferAutofill(prev.cpfCnpj, autofillQuery.data.cpfCnpj)),
        razaoSocial: preferAutofill(prev.razaoSocial, autofillQuery.data.razaoSocial),
        inscricaoMunicipal: preferAutofill(prev.inscricaoMunicipal, autofillQuery.data.inscricaoMunicipal),
        inscricaoEstadual: preferAutofill(prev.inscricaoEstadual, autofillQuery.data.inscricaoEstadual),
        suframa: preferAutofill(prev.suframa, autofillQuery.data.suframa),
        email: preferAutofill(prev.email, autofillQuery.data.email),
        cep: formatCep(preferAutofill(prev.cep, autofillQuery.data.cep)),
        logradouro: preferAutofill(prev.logradouro, autofillQuery.data.logradouro),
        numero: preferAutofill(prev.numero, autofillQuery.data.numero),
        complemento: preferAutofill(prev.complemento, autofillQuery.data.complemento),
        bairro: preferAutofill(prev.bairro, autofillQuery.data.bairro),
        localidadeUf: preferAutofill(prev.localidadeUf, autofillQuery.data.localidadeUf),
      };
    });
    setLastAutofillDoc(cpfCnpjDigits);
    toast({
      title: 'Autopreenchimento concluído',
      description: 'Campos preenchidos com merge de múltiplas fontes.',
    });
  }, [autofillQuery.data, cpfCnpjDigits, isEdit, lastAutofillDoc]);

  const cepDigits = useMemo(() => normalizeCep(form.cep), [form.cep]);
  const cepLookupQuery = useQuery({
    queryKey: ['cep-lookup', 'tomador-form', cepDigits],
    queryFn: () => lookupCep(cepDigits),
    enabled: cepDigits.length === 8,
    staleTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    if (!cepLookupQuery.data) return;
    setForm((prev) => ({
      ...prev,
      cep: formatCep(cepLookupQuery.data.cep),
      logradouro: cepLookupQuery.data.logradouro || prev.logradouro,
      bairro: cepLookupQuery.data.bairro || prev.bairro,
      localidadeUf: cepLookupQuery.data.cidade && cepLookupQuery.data.uf
        ? `${cepLookupQuery.data.cidade} - ${cepLookupQuery.data.uf}`
        : prev.localidadeUf,
    }));
  }, [cepLookupQuery.data]);

  const mutation = useMutation({
    mutationFn: () => {
      const { municipio, uf } = parseLocalidadeUf(form.localidadeUf);
      const payload = {
        empresaCnpj: (form.empresaCnpj || fallbackEmpresaCnpj).replace(/\D/g, ''),
        cpfCnpj: form.cpfCnpj.replace(/\D/g, ''),
        razaoSocial: form.razaoSocial.trim(),
        inscricaoMunicipal: form.inscricaoMunicipal || undefined,
        inscricaoEstadual: form.inscricaoEstadual || undefined,
        suframa: form.suframa || undefined,
        email: form.email || undefined,
        endereco: {
          logradouro: form.logradouro || undefined,
          numero: form.numero || undefined,
          complemento: form.complemento || undefined,
          bairro: form.bairro || undefined,
          municipio: municipio || undefined,
          uf: uf || undefined,
          cep: normalizeCep(form.cep) || undefined,
        },
      };

      if (isEdit) {
        return tomadoresApi.update(id!, {
          razaoSocial: payload.razaoSocial,
          inscricaoMunicipal: payload.inscricaoMunicipal,
          inscricaoEstadual: payload.inscricaoEstadual,
          suframa: payload.suframa,
          email: payload.email,
          endereco: payload.endereco,
        });
      }

      return tomadoresApi.create(payload);
    },
    onSuccess: () => {
      toast({ title: isEdit ? 'Tomador atualizado' : 'Tomador cadastrado' });
      queryClient.invalidateQueries({ queryKey: ['tomadores'] });
      navigate('/tomadores');
    },
  });

  const update = (field: keyof TomadorSectionData, value: string | boolean) => {
    if (field === 'empresaCnpj' || field === 'cpfCnpj') {
      setForm((prev) => ({ ...prev, [field]: formatDoc(String(value)) }));
      if (field === 'cpfCnpj') {
        setLastAutofillDoc('');
      }
      return;
    }
    if (field === 'cep') {
      setForm((prev) => ({ ...prev, cep: formatCep(String(value)) }));
      return;
    }
    if (field === 'whatsapp') {
      setForm((prev) => ({ ...prev, whatsapp: formatPhone(String(value)) }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value as never }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cpfCnpj || !form.razaoSocial) {
      toast({
        title: 'Dados obrigatórios',
        description: 'Preencha CPF/CNPJ e nome completo ou razão social do tomador.',
        variant: 'destructive',
      });
      return;
    }
    mutation.mutate();
  };

  if (isEdit && isLoading) return <LoadingState />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tomadores')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{isEdit ? 'Editar Tomador' : 'Novo Tomador'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <TomadorSection
          data={form}
          onChange={update}
          cepLoading={cepLookupQuery.isFetching}
          cnpjLoading={autofillQuery.isFetching}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {mutation.isPending ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Cadastrar Tomador'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TomadorFormPage;
