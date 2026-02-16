import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { empresasApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import LoadingState from '@/components/LoadingState';

interface EmpresaFormData {
  razaoSocial: string;
  cnpj: string;
  nomeFantasia: string;
  inscricaoMunicipal: string;
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
}

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
    endereco: '', cidade: '', uf: '', cep: '', telefone: '', email: '',
  });

  useEffect(() => {
    if (existing) {
      setForm({
        razaoSocial: existing.razaoSocial, cnpj: existing.cnpj,
        nomeFantasia: existing.nomeFantasia || '', inscricaoMunicipal: existing.inscricaoMunicipal || '',
        endereco: existing.endereco?.logradouro || '', cidade: existing.cidade || existing.endereco?.cidade || existing.endereco?.descricaoCidade || '',
        uf: existing.uf || existing.endereco?.uf || existing.endereco?.estado || '', cep: existing.cep || existing.endereco?.cep || '',
        telefone: existing.telefone || existing.fone || '', email: existing.email || '',
      });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: () => isEdit ? empresasApi.update(id!, {
      razaoSocial: form.razaoSocial,
      nomeFantasia: form.nomeFantasia,
      inscricaoMunicipal: form.inscricaoMunicipal,
      email: form.email,
      telefone: form.telefone,
      endereco: {
        logradouro: form.endereco,
        cidade: form.cidade,
        uf: form.uf,
        cep: form.cep,
      },
    }) : empresasApi.create({ cnpj: form.cnpj, razaoSocial: '' }),
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
          Importe o certificado digital da empresa antes do cadastro operacional e da emissão de NFSe.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Razão Social</Label>
                <Input value={form.razaoSocial} onChange={e => update('razaoSocial', e.target.value)} required={isEdit} disabled={!isEdit} />
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
              <div className="space-y-2 sm:col-span-2">
                <Label>Endereço</Label>
                <Input value={form.endereco} onChange={e => update('endereco', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={form.cidade} onChange={e => update('cidade', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>UF</Label>
                  <Input value={form.uf} onChange={e => update('uf', e.target.value)} maxLength={2} />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input value={form.cep} onChange={e => update('cep', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={e => update('telefone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isEdit ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmpresaFormPage;
