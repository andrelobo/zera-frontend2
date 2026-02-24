import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoadingState from '@/components/LoadingState';
import TomadorSection, { type TomadorSectionData } from '@/components/TomadorSection';
import { formatCep, lookupCep, normalizeCep } from '@/services/cep';
import { tomadoresApi } from '@/services/api';
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

const INITIAL_FORM: TomadorSectionData = {
  empresaCnpj: '',
  cpfCnpj: '',
  razaoSocial: '',
  inscricaoMunicipal: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  municipio: '',
  uf: '',
  email: '',
};

const TomadorFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TomadorSectionData>(INITIAL_FORM);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['tomador', id],
    queryFn: () => tomadoresApi.getById(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existing) return;
    setForm({
      empresaCnpj: formatDoc(existing.empresaCnpj),
      cpfCnpj: formatDoc(existing.cpfCnpj),
      razaoSocial: existing.razaoSocial,
      inscricaoMunicipal: existing.inscricaoMunicipal || '',
      cep: formatCep(existing.endereco?.cep || ''),
      logradouro: existing.endereco?.logradouro || '',
      numero: existing.endereco?.numero || '',
      complemento: existing.endereco?.complemento || '',
      bairro: existing.endereco?.bairro || '',
      municipio: existing.endereco?.municipio || '',
      uf: existing.endereco?.uf || '',
      email: existing.email || '',
    });
  }, [existing]);

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
      municipio: cepLookupQuery.data.cidade || prev.municipio,
      uf: cepLookupQuery.data.uf || prev.uf,
    }));
  }, [cepLookupQuery.data]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        empresaCnpj: form.empresaCnpj.replace(/\D/g, ''),
        cpfCnpj: form.cpfCnpj.replace(/\D/g, ''),
        razaoSocial: form.razaoSocial.trim(),
        inscricaoMunicipal: form.inscricaoMunicipal || undefined,
        email: form.email || undefined,
        endereco: {
          logradouro: form.logradouro || undefined,
          numero: form.numero || undefined,
          complemento: form.complemento || undefined,
          bairro: form.bairro || undefined,
          municipio: form.municipio || undefined,
          uf: form.uf || undefined,
          cep: normalizeCep(form.cep) || undefined,
        },
      };

      if (isEdit) {
        return tomadoresApi.update(id!, {
          razaoSocial: payload.razaoSocial,
          inscricaoMunicipal: payload.inscricaoMunicipal,
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

  const update = (field: keyof TomadorSectionData, value: string) => {
    if (field === 'empresaCnpj' || field === 'cpfCnpj') {
      setForm((prev) => ({ ...prev, [field]: formatDoc(value) }));
      return;
    }
    if (field === 'cep') {
      setForm((prev) => ({ ...prev, cep: formatCep(value) }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresaCnpj || !form.cpfCnpj || !form.razaoSocial) {
      toast({
        title: 'Dados obrigatórios',
        description: 'Preencha empresa, CPF/CNPJ e razão social do tomador.',
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

      <Alert>
        <AlertDescription>
          Cadastro e listagem são telas separadas. Esta página é exclusiva para criação/edição.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-4">
        <TomadorSection
          data={form}
          onChange={update}
          disabledEmpresaCnpj={isEdit}
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
