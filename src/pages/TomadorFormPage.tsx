import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, Printer, Save } from 'lucide-react';
import LoadingState from '@/components/LoadingState';
import TomadorSection, { type TomadorSectionData } from '@/components/TomadorSection';
import { formatCep, normalizeCep } from '@/services/cep';
import { empresasApi, tomadoresApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { validateCNPJ, validateEmail } from '@/utils/validators';

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
      toast({ title: 'Documento inválido', description: 'CNPJ/CPF inválido.', variant: 'destructive' });
      return;
    }
    if (form.email && !validateEmail(form.email)) {
      toast({ title: 'E-mail inválido', description: 'Verifique o e-mail informado.', variant: 'destructive' });
      return;
    }
    if (!form.razaoSocial) {
      toast({ title: 'Dados obrigatórios', description: 'Preencha o nome/razão social.', variant: 'destructive' });
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
          <TomadorSection data={form} onChange={update} />

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
