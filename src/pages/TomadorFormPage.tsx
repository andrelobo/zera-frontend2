import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, CheckCircle, Save } from 'lucide-react';
import LoadingState from '@/components/LoadingState';
import TomadorSection, { isCPF, type TomadorSectionData } from '@/components/TomadorSection';
import { formatCep, normalizeCep } from '@/services/cep';
import { empresasApi, tomadoresApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { formatPhone, normalizeLogradouro, validateCNPJ, validateEmail } from '@/utils/validators';

const INITIAL_FORM: TomadorSectionData = {
  cnpjCpf: '',
  nomeEmpresarial: '',
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
const isCpfContext = (value: string) => isCPF(value);

const TomadorFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<TomadorSectionData>(INITIAL_FORM);
  const [fallbackEmpresaCnpj, setFallbackEmpresaCnpj] = useState('');

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

  const empresaCnpjContext = useMemo(
    () => (existing?.empresaCnpj || fallbackEmpresaCnpj || '').replace(/\D/g, ''),
    [existing?.empresaCnpj, fallbackEmpresaCnpj],
  );

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
      cnpjCpf: formatDoc(existing.cpfCnpj),
      nomeEmpresarial: existing.razaoSocial,
      nomeFantasia: existing.nomeFantasia || '',
      inscricaoMunicipal: existing.inscricaoMunicipal || '',
      inscricaoEstadual: existing.inscricaoEstadual || '',
      suframa: existing.suframa || '',
      substitutoTributario: Boolean(existing.substitutoTributario),
      cep: formatCep(existing.endereco?.cep || ''),
      logradouro: normalizeLogradouro(existing.endereco?.logradouro || ''),
      numero: existing.endereco?.numero || '',
      complemento: existing.endereco?.complemento || '',
      bairro: existing.endereco?.bairro || '',
      localidadeUf: municipio && uf ? `${municipio} - ${uf}` : municipio || '',
      email: existing.email || '',
      whatsapp: formatPhone(existing.whatsapp || ''),
    });
  }, [existing]);

  const docDigits = onlyDigits(form.cnpjCpf);
  const docOk = docDigits.length === 11 ? validateCPF(docDigits) : validateCNPJ(docDigits);

  const { data: tomadoresMesmoDocumento = [] } = useQuery({
    queryKey: ['tomadores', 'duplicidade', empresaCnpjContext, docDigits],
    queryFn: () => tomadoresApi.list({ empresaCnpj: empresaCnpjContext, q: docDigits }),
    enabled: empresaCnpjContext.length === 14 && (docDigits.length === 11 || docDigits.length === 14) && docOk,
  });

  const tomadorDuplicado = useMemo(
    () => tomadoresMesmoDocumento.find((item) => item.cpfCnpj.replace(/\D/g, '') === docDigits && item.id !== id) || null,
    [docDigits, id, tomadoresMesmoDocumento],
  );

  const mutation = useMutation({
    mutationFn: () => {
      const cpfContext = isCpfContext(form.cnpjCpf);
      const { municipio, uf } = parseLocalidadeUf(form.localidadeUf);
      const payload = {
        empresaCnpj: fallbackEmpresaCnpj.replace(/\D/g, ''),
        cpfCnpj: form.cnpjCpf.replace(/\D/g, ''),
        razaoSocial: form.nomeEmpresarial.trim(),
        nomeFantasia: cpfContext ? undefined : (form.nomeFantasia || undefined),
        inscricaoMunicipal: cpfContext ? undefined : (form.inscricaoMunicipal || undefined),
        inscricaoEstadual: cpfContext ? undefined : (form.inscricaoEstadual || undefined),
        suframa: cpfContext ? undefined : (form.suframa || undefined),
        substitutoTributario: cpfContext ? false : form.substitutoTributario,
        email: form.email || undefined,
        whatsapp: form.whatsapp || undefined,
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
          nomeFantasia: payload.nomeFantasia,
          inscricaoMunicipal: payload.inscricaoMunicipal,
          inscricaoEstadual: payload.inscricaoEstadual,
          suframa: payload.suframa,
          substitutoTributario: payload.substitutoTributario,
          email: payload.email,
          whatsapp: payload.whatsapp,
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

  const handleSectionChange = (nextData: TomadorSectionData) => {
    setForm({
      ...nextData,
      cnpjCpf: formatDoc(nextData.cnpjCpf || ''),
      cep: formatCep(nextData.cep || ''),
      whatsapp: formatPhone(nextData.whatsapp || ''),
      logradouro: normalizeLogradouro(nextData.logradouro || ''),
      nomeEmpresarial: toUpperTrimmed(nextData.nomeEmpresarial),
      nomeFantasia: toUpperTrimmed(nextData.nomeFantasia),
      inscricaoMunicipal: toUpperTrimmed(nextData.inscricaoMunicipal),
      inscricaoEstadual: toUpperTrimmed(nextData.inscricaoEstadual),
      suframa: toUpperTrimmed(nextData.suframa),
      bairro: toUpperTrimmed(nextData.bairro),
      localidadeUf: toUpperTrimmed(nextData.localidadeUf),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docOk) {
      toast({ title: 'Documento inválido', description: 'CNPJ/CPF inválido.', variant: 'destructive' });
      return;
    }
    if (tomadorDuplicado) {
      toast({
        title: 'Tomador já cadastrado',
        description: `Já existe um tomador com este CPF/CNPJ: ${tomadorDuplicado.razaoSocial}.`,
        variant: 'destructive',
      });
      return;
    }
    if (form.email && !validateEmail(form.email)) {
      toast({ title: 'E-mail inválido', description: 'Verifique o e-mail informado.', variant: 'destructive' });
      return;
    }
    if (!form.nomeEmpresarial) {
      toast({ title: 'Dados obrigatórios', description: 'Preencha o nome/razão social.', variant: 'destructive' });
      return;
    }
    mutation.mutate();
  };

  if (isEdit && isLoading) return <LoadingState />;
  const configValida = docDigits.length >= 11 && docOk && !tomadorDuplicado && (form.email === '' || validateEmail(form.email));

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/tomadores')} className="btn-secondary p-2" title="Voltar">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">O Tomador</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tomadorDuplicado && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="w-4 h-4" />
                Tomador já cadastrado para este CPF/CNPJ
              </div>
            )}
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
          <TomadorSection data={form} onChange={handleSectionChange} onAutosave={() => undefined} />

          <div className="section-card">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {tomadorDuplicado && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  Tomador já cadastrado: {tomadorDuplicado.razaoSocial}
                </div>
              )}
              {configValida && (
                <div className="alert-success flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Dados do tomador válidos
                </div>
              )}
              <div className="flex items-center gap-3 ml-auto no-print">
                <button
                  type="button"
                  onClick={() => navigate('/tomadores')}
                  className="btn-secondary flex items-center gap-2"
                >
                  Voltar para listagem
                </button>
                <button type="submit" disabled={mutation.isPending} className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {mutation.isPending ? 'Salvando...' : 'Salvar Tomador'}
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
