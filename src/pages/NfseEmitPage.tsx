import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { nfseApi, empresasApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { EmitirNfseRequest } from '@/types/api';

const NfseEmitPage = () => {
  const navigate = useNavigate();

  const { data: empresas } = useQuery({
    queryKey: ['empresas'],
    queryFn: empresasApi.list,
  });

  const [form, setForm] = useState<EmitirNfseRequest>({
    empresaId: '',
    tomadorCnpjCpf: '',
    tomadorRazaoSocial: '',
    descricaoServico: '',
    valorServico: 0,
    aliquotaIss: undefined,
    codigoServico: '',
  });

  const mutation = useMutation({
    mutationFn: () => nfseApi.emitir(form),
    onSuccess: (data) => {
      toast({ title: 'NFSe emitida', description: `ID: ${data.id}` });
      navigate(`/nfse/${data.id}`);
    },
  });

  const update = (key: keyof EmitirNfseRequest, value: string | number) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/nfse')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Nova Emissão de NFSe</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Dados da Nota</CardTitle></CardHeader>
        <CardContent>
          <form
            onSubmit={e => { e.preventDefault(); mutation.mutate(); }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Empresa Emissora</Label>
              <Select value={form.empresaId} onValueChange={v => update('empresaId', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                <SelectContent>
                  {(empresas || []).map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.razaoSocial} ({e.cnpj})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>CPF/CNPJ Tomador</Label>
                <Input value={form.tomadorCnpjCpf} onChange={e => update('tomadorCnpjCpf', e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-2">
                <Label>Razão Social Tomador</Label>
                <Input value={form.tomadorRazaoSocial} onChange={e => update('tomadorRazaoSocial', e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição do Serviço</Label>
              <Textarea value={form.descricaoServico} onChange={e => update('descricaoServico', e.target.value)} required rows={3} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" min="0" value={form.valorServico || ''} onChange={e => update('valorServico', parseFloat(e.target.value) || 0)} required />
              </div>
              <div className="space-y-2">
                <Label>Alíquota ISS (%)</Label>
                <Input type="number" step="0.01" value={form.aliquotaIss || ''} onChange={e => update('aliquotaIss', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Código do Serviço</Label>
                <Input value={form.codigoServico} onChange={e => update('codigoServico', e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={mutation.isPending || !form.empresaId || !form.descricaoServico}>
                {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Emitir NFSe
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NfseEmitPage;
