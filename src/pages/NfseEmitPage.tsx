import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { nfseApi, empresasApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Search, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { EmitirNfseRequest } from '@/types/api';

const buildReferencia = () => `nfse-front-${Date.now()}`;

const NfseEmitPage = () => {
  const navigate = useNavigate();

  const { data: empresas } = useQuery({
    queryKey: ['empresas'],
    queryFn: empresasApi.list,
  });

  const [empresaId, setEmpresaId] = useState('');
  const [prestadorCnpj, setPrestadorCnpj] = useState('');
  const [tomadorCpfCnpj, setTomadorCpfCnpj] = useState('');
  const [tomadorRazaoSocial, setTomadorRazaoSocial] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState<number>(0);
  const [codigoNacional, setCodigoNacional] = useState('171901');
  const [codigoTributacao, setCodigoTributacao] = useState('100');
  const [referenciaExterna, setReferenciaExterna] = useState(buildReferencia());
  const [empresaByCnpj, setEmpresaByCnpj] = useState<(typeof empresas extends Array<infer T> ? T : never) | null>(null);

  const empresaSelecionada = useMemo(() => {
    if (empresaByCnpj) return empresaByCnpj;
    return (empresas || []).find((e) => e.id === empresaId) || null;
  }, [empresas, empresaByCnpj, empresaId]);

  const buscarEmpresaMutation = useMutation({
    mutationFn: (cnpj: string) => empresasApi.getByCnpj(cnpj),
    onSuccess: (empresa) => {
      setEmpresaByCnpj(empresa);
      setPrestadorCnpj(empresa.cnpj);
      toast({ title: 'Prestador carregado', description: `${empresa.razaoSocial} (${empresa.cnpj})` });
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: EmitirNfseRequest) => nfseApi.emitir(payload),
    onSuccess: (data) => {
      toast({ title: 'NFSe enviada', description: `Emissão: ${data.emissionId}` });
      navigate(`/nfse/${data.emissionId}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaSelecionada) return;

    const payload: EmitirNfseRequest = {
      prestador: {
        cnpj: empresaSelecionada.cnpj,
        inscricaoMunicipal: empresaSelecionada.inscricaoMunicipal,
        razaoSocial: empresaSelecionada.razaoSocial,
        regimeTributarioSn: {
          opSimpNac: 3,
          regApTribSN: 1,
          regEspTrib: 0,
        },
        endereco: {
          logradouro: empresaSelecionada.endereco?.logradouro,
          numero: empresaSelecionada.endereco?.numero,
          bairro: empresaSelecionada.endereco?.bairro,
          municipio: empresaSelecionada.endereco?.cidade || empresaSelecionada.endereco?.descricaoCidade,
          uf: empresaSelecionada.endereco?.uf || empresaSelecionada.endereco?.estado,
          cep: empresaSelecionada.endereco?.cep,
        },
      },
      tomador: {
        cpfCnpj: tomadorCpfCnpj,
        razaoSocial: tomadorRazaoSocial,
      },
      servico: {
        codigoNacional,
        codigoTributacao: codigoTributacao || undefined,
        descricao,
        valor,
      },
      referenciaExterna,
    };

    mutation.mutate(payload);
  };

  const handleBuscarPrestador = () => {
    const cnpj = prestadorCnpj.replace(/\D/g, '');
    if (!cnpj) return;
    buscarEmpresaMutation.mutate(cnpj);
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Empresa Emissora</Label>
              <Select
                value={empresaId}
                onValueChange={(value) => {
                  setEmpresaId(value);
                  setEmpresaByCnpj(null);
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                <SelectContent>
                  {(empresas || []).map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.razaoSocial} ({empresa.cnpj})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ou buscar prestador por CNPJ</Label>
              <div className="flex gap-2">
                <Input
                  value={prestadorCnpj}
                  onChange={(ev) => setPrestadorCnpj(ev.target.value)}
                  placeholder="Somente números"
                />
                <Button type="button" variant="outline" onClick={handleBuscarPrestador} disabled={buscarEmpresaMutation.isPending}>
                  {buscarEmpresaMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Buscar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Referência Externa</Label>
              <div className="flex gap-2">
                <Input value={referenciaExterna} onChange={(ev) => setReferenciaExterna(ev.target.value)} required />
                <Button type="button" variant="outline" onClick={() => setReferenciaExterna(buildReferencia())}>Gerar</Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>CPF/CNPJ Tomador</Label>
                <Input value={tomadorCpfCnpj} onChange={(ev) => setTomadorCpfCnpj(ev.target.value)} placeholder="Somente números" required />
              </div>
              <div className="space-y-2">
                <Label>Razão Social Tomador</Label>
                <Input value={tomadorRazaoSocial} onChange={(ev) => setTomadorRazaoSocial(ev.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição do Serviço</Label>
              <Textarea value={descricao} onChange={(ev) => setDescricao(ev.target.value)} required rows={3} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" min="0" value={valor || ''} onChange={(ev) => setValor(parseFloat(ev.target.value) || 0)} required />
              </div>
              <div className="space-y-2">
                <Label>Código Nacional</Label>
                <Input value={codigoNacional} onChange={(ev) => setCodigoNacional(ev.target.value)} maxLength={6} required />
              </div>
              <div className="space-y-2">
                <Label>Código Tributação</Label>
                <Input value={codigoTributacao} onChange={(ev) => setCodigoTributacao(ev.target.value)} />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={mutation.isPending || !empresaSelecionada || !descricao || !tomadorCpfCnpj || !tomadorRazaoSocial || !codigoNacional}
              >
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
