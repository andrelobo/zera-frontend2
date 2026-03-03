import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, Printer, Save } from 'lucide-react';
import LoadingState from '@/components/LoadingState';
import TomadorSection, { type TomadorSectionData } from '@/components/TomadorSection';
import { formatCep, lookupCep, normalizeCep } from '@/services/cep';
import { empresasApi, tomadoresApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { validateCNPJ, validateEmail } from '@/utils/validators';

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

const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(cleaned[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (Number(cleaned[9]) !== rest) return false;
  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(cleaned[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return Number(cleaned[10]) === rest;
};

const parseLocalidadeUf = (value: string) => {
  const [municipioRaw, ufRaw] = value.split('-').map((part) => part.trim());
  return {
    municipio: municipioRaw || '',
    uf: (ufRaw || '').toUpperCase(),
  };
};

const onlyDigits = (value: string) => value.replace(/\D/g, '');
const toUpperTrimmed = (value?: string) => (value || '').trim().toUpperCase();
const normalizeLogradouro = (value?: string) =>
  toUpperTrimmed(value).replace(/^RUA\b\.?\s*/u, 'R ');
const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  const normalized = digits.length === 10
    ? `${digits.slice(0, 2)}9${digits.slice(2)}`
    : digits;
  const cleaned = normalized.slice(0, 11);
  return cleaned
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d)(\d{4})$/, '$1-$2');
};

type AutofillTomador = {
  cpfCnpj?: string;
  razaoSocial?: string;
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

const pickAutofill = (...values: Array<string | undefined>) => {
  for (const value of values) {
    if ((value || '').trim()) return value;
  }
  return undefined;
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

      const merged: AutofillTomador = {
        cpfCnpj: pickAutofill(fromTomador?.cpfCnpj),
        razaoSocial: pickAutofill(fromPreview?.razaoSocial, fromEmpresa?.razaoSocial, fromTomador?.razaoSocial),
        inscricaoEstadual: pickAutofill(fromPreview?.inscricaoEstadual, fromEmpresa?.inscricaoEstadual, fromTomador?.inscricaoEstadual),
        suframa: pickAutofill(fromPreview?.suframa, fromEmpresa?.suframa, fromTomador?.suframa),
        email: pickAutofill(fromPreview?.email, fromEmpresa?.email, fromTomador?.email),
        cep: pickAutofill(fromPreview?.cep, fromEmpresa?.cep, fromTomador?.cep),
        logradouro: pickAutofill(fromPreview?.logradouro, fromEmpresa?.logradouro, fromTomador?.logradouro),
        numero: pickAutofill(fromPreview?.numero, fromEmpresa?.numero, fromTomador?.numero),
        complemento: pickAutofill(fromPreview?.complemento, fromEmpresa?.complemento, fromTomador?.complemento),
        bairro: pickAutofill(fromPreview?.bairro, fromEmpresa?.bairro, fromTomador?.bairro),
        localidadeUf: pickAutofill(fromPreview?.localidadeUf, fromEmpresa?.localidadeUf, fromTomador?.localidadeUf),
      };

      return Object.values(merged).some(Boolean) ? merged : null;
    },
  });

  useEffect(() => {
    if (isEdit) return;
    if (!autofillQuery.data) return;
    if (lastAutofillDoc === cpfCnpjDigits) return;

    setForm((prev) => ({
      ...prev,
      cpfCnpj: formatDoc(autofillQuery.data.cpfCnpj || cpfCnpjDigits),
      razaoSocial: toUpperTrimmed(autofillQuery.data.razaoSocial),
      inscricaoEstadual: toUpperTrimmed(autofillQuery.data.inscricaoEstadual),
      suframa: toUpperTrimmed(autofillQuery.data.suframa),
      email: (autofillQuery.data.email || '').trim(),
      cep: formatCep((autofillQuery.data.cep || '').trim()),
      logradouro: normalizeLogradouro(autofillQuery.data.logradouro),
      numero: (autofillQuery.data.numero || '').trim(),
      complemento: toUpperTrimmed(autofillQuery.data.complemento),
      bairro: toUpperTrimmed(autofillQuery.data.bairro),
      localidadeUf: toUpperTrimmed(autofillQuery.data.localidadeUf),
    }));
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
      logradouro: normalizeLogradouro(cepLookupQuery.data.logradouro || prev.logradouro),
      bairro: toUpperTrimmed(cepLookupQuery.data.bairro || prev.bairro),
      localidadeUf: cepLookupQuery.data.cidade && cepLookupQuery.data.uf
        ? `${toUpperTrimmed(cepLookupQuery.data.cidade)} - ${toUpperTrimmed(cepLookupQuery.data.uf)}`
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
      if (field === 'cpfCnpj') {
        setForm((prev) => {
          const prevDigits = onlyDigits(prev.cpfCnpj);
          const nextCpfCnpj = formatDoc(String(value));
          const nextDigits = onlyDigits(nextCpfCnpj);
          const docChanged = prevDigits !== nextDigits;
          const hadStableDoc = prevDigits.length === 11 || prevDigits.length === 14;
          const hasStableNextDoc = nextDigits.length === 11 || nextDigits.length === 14;

          // Prevent stale autofill values from a previous document.
          if (docChanged && hadStableDoc && hasStableNextDoc) {
            return {
              ...prev,
              cpfCnpj: nextCpfCnpj,
              razaoSocial: '',
              nomeFantasia: '',
              inscricaoMunicipal: '',
              inscricaoEstadual: '',
              suframa: '',
              cep: '',
              logradouro: '',
              numero: '',
              complemento: '',
              bairro: '',
              localidadeUf: '',
              email: '',
              whatsapp: '',
            };
          }

          return { ...prev, cpfCnpj: nextCpfCnpj };
        });
      } else {
        setForm((prev) => ({ ...prev, [field]: formatDoc(String(value)) }));
      }
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
    if (field === 'logradouro') {
      setForm((prev) => ({ ...prev, logradouro: normalizeLogradouro(String(value)) }));
      return;
    }
    if (field === 'razaoSocial' || field === 'inscricaoMunicipal' || field === 'inscricaoEstadual' || field === 'suframa' || field === 'bairro' || field === 'localidadeUf') {
      setForm((prev) => ({ ...prev, [field]: toUpperTrimmed(String(value)) as never }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value as never }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const docDigits = onlyDigits(form.cpfCnpj);
    const docOk = docDigits.length === 11 ? validateCPF(docDigits) : validateCNPJ(docDigits);
    if (!docOk) {
      toast({
        title: 'Documento inválido',
        description: 'CNPJ/CPF inválido. Verifique o número informado.',
        variant: 'destructive',
      });
      return;
    }
    if (form.email && !validateEmail(form.email)) {
      toast({
        title: 'E-mail inválido',
        description: 'Verifique o e-mail informado.',
        variant: 'destructive',
      });
      return;
    }
    if (!form.razaoSocial) {
      toast({
        title: 'Dados obrigatórios',
        description: 'Preencha nome completo ou razão social do tomador.',
        variant: 'destructive',
      });
      return;
    }
    mutation.mutate();
  };

  if (isEdit && isLoading) return <LoadingState />;

  const docDigits = onlyDigits(form.cpfCnpj);
  const docOk = docDigits.length === 11 ? validateCPF(docDigits) : validateCNPJ(docDigits);
  const configValida = docDigits.length >= 11 && docOk && (form.email === '' || validateEmail(form.email));

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/tomadores')} className="btn-outline p-2" title="Voltar">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">O Tomador</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {configValida && (
              <div className="alert-success flex items-center gap-2 text-xs">
                <CheckCircle className="w-4 h-4" />
                Dados do tomador válidos
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-2">
        <form onSubmit={handleSubmit} className="space-y-2">
          <TomadorSection
            data={form}
            onChange={update}
            cepLoading={cepLookupQuery.isFetching}
            cnpjLoading={autofillQuery.isFetching}
          />

          <div className="section-card">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {configValida && (
                <div className="alert-success flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Dados do tomador válidos
                </div>
              )}
              <div className="flex items-center gap-3 ml-auto no-print">
                <button type="button" onClick={() => window.print()} className="btn-outline flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
                <button type="submit" disabled={mutation.isPending} className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {mutation.isPending ? 'Salvando...' : isEdit ? 'Salvar Tomador' : 'Salvar Tomador'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default TomadorFormPage;
