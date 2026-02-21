import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { nfseApi, empresasApi } from '@/services/api';
import { formatCep, lookupCep, normalizeCep } from '@/services/cep';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Search, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { EmitirNfseRequest, Empresa } from '@/types/api';

const buildReferencia = () => `nfse-front-${Date.now()}`;
const MIN_AUTOCOMPLETE_CHARS = 2;

const extractServiceCode = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 6) return '';
  return digits.slice(0, 6);
};

const NfseEmitPage = () => {
  const navigate = useNavigate();

  const [empresaSearch, setEmpresaSearch] = useState('');
  const [empresaSearchDebounced, setEmpresaSearchDebounced] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceSearchDebounced, setServiceSearchDebounced] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);

  const [prestadorCnpj, setPrestadorCnpj] = useState('');
  const [tomadorCpfCnpj, setTomadorCpfCnpj] = useState('');
  const [tomadorRazaoSocial, setTomadorRazaoSocial] = useState('');
  const [tomadorLogradouro, setTomadorLogradouro] = useState('');
  const [tomadorNumero, setTomadorNumero] = useState('');
  const [tomadorBairro, setTomadorBairro] = useState('');
  const [tomadorMunicipio, setTomadorMunicipio] = useState('');
  const [tomadorUf, setTomadorUf] = useState('');
  const [tomadorCep, setTomadorCep] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState<number>(0);
  const [codigoNacional, setCodigoNacional] = useState('171901');
  const [codigoTributacao, setCodigoTributacao] = useState('100');
  const [referenciaExterna, setReferenciaExterna] = useState(buildReferencia());
  const [empresaByCnpj, setEmpresaByCnpj] = useState<Empresa | null>(null);
  const codigoNacionalClean = useMemo(() => codigoNacional.replace(/\D/g, ''), [codigoNacional]);
  const tomadorCepDigits = useMemo(() => normalizeCep(tomadorCep), [tomadorCep]);

  useEffect(() => {
    const timer = setTimeout(() => setEmpresaSearchDebounced(empresaSearch), 250);
    return () => clearTimeout(timer);
  }, [empresaSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setServiceSearchDebounced(serviceSearch), 250);
    return () => clearTimeout(timer);
  }, [serviceSearch]);

  const canSearchEmpresa = empresaSearchDebounced.trim().length >= MIN_AUTOCOMPLETE_CHARS;
  const { data: empresas = [], isLoading: empresasLoading } = useQuery({
    queryKey: ['empresas'],
    queryFn: empresasApi.list,
    staleTime: 60_000,
  });
  const filteredEmpresas = useMemo(() => {
    if (!canSearchEmpresa) return [];
    const searchRaw = empresaSearchDebounced.trim().toLowerCase();
    const searchDigits = searchRaw.replace(/\D/g, '');
    return empresas
      .filter((empresa) => {
        const razao = empresa.razaoSocial.toLowerCase();
        const fantasia = (empresa.nomeFantasia || '').toLowerCase();
        const cnpj = empresa.cnpj.replace(/\D/g, '');
        return razao.includes(searchRaw) || fantasia.includes(searchRaw) || cnpj.includes(searchDigits);
      })
      .slice(0, 8);
  }, [canSearchEmpresa, empresas, empresaSearchDebounced]);

  const empresaSelecionada = useMemo(() => {
    if (empresaByCnpj) return empresaByCnpj;
    return selectedEmpresa;
  }, [empresaByCnpj, selectedEmpresa]);

  const canSearchService = serviceSearchDebounced.trim().length >= MIN_AUTOCOMPLETE_CHARS;
  const serviceQuery = useQuery({
    queryKey: ['nfse-emit-service-autocomplete', serviceSearchDebounced],
    queryFn: async () => {
      try {
        return await nfseApi.servicosList(
          { q: serviceSearchDebounced, limit: 8 },
          { skipGlobalErrorToast: true },
        );
      } catch {
        return nfseApi.servicosAutocomplete({ q: serviceSearchDebounced, limit: 8 });
      }
    },
    enabled: canSearchService,
    staleTime: 60_000,
  });

  const cepLookupQuery = useQuery({
    queryKey: ['cep-lookup', 'nfse-emit-tomador', tomadorCepDigits],
    queryFn: () => lookupCep(tomadorCepDigits),
    enabled: tomadorCepDigits.length === 8,
    staleTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    if (!cepLookupQuery.data) return;
    const address = cepLookupQuery.data;
    setTomadorLogradouro((prev) => address.logradouro || prev);
    setTomadorBairro((prev) => address.bairro || prev);
    setTomadorMunicipio((prev) => address.cidade || prev);
    setTomadorUf((prev) => address.uf || prev);
    setTomadorCep(formatCep(address.cep));
  }, [cepLookupQuery.data]);

  const buscarEmpresaMutation = useMutation({
    mutationFn: (cnpj: string) => empresasApi.getByCnpj(cnpj),
    onSuccess: (empresa) => {
      setEmpresaByCnpj(empresa);
      setSelectedEmpresa(empresa);
      setPrestadorCnpj(empresa.cnpj);
      setEmpresaSearch(`${empresa.razaoSocial} (${empresa.cnpj})`);
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

    const tomadorEndereco = {
      logradouro: tomadorLogradouro || undefined,
      numero: tomadorNumero || undefined,
      bairro: tomadorBairro || undefined,
      municipio: tomadorMunicipio || empresaSelecionada.endereco?.cidade || empresaSelecionada.endereco?.descricaoCidade || undefined,
      uf: tomadorUf || empresaSelecionada.endereco?.uf || empresaSelecionada.endereco?.estado || undefined,
      cep: normalizeCep(tomadorCep) || undefined,
    };

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
        endereco: tomadorEndereco,
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
              <Label htmlFor="empresaSearch">Empresa Emissora (autocomplete)</Label>
              <Input
                id="empresaSearch"
                value={empresaSearch}
                onChange={(ev) => {
                  setEmpresaSearch(ev.target.value);
                  setEmpresaByCnpj(null);
                  setSelectedEmpresa(null);
                }}
                placeholder="Digite razão social ou CNPJ"
              />
              {empresasLoading && (
                <p className="text-sm text-muted-foreground">Carregando empresas...</p>
              )}
              {filteredEmpresas.length > 0 && (
                <div className="max-h-44 overflow-auto rounded-md border p-1">
                  {filteredEmpresas.map((empresa) => (
                    <button
                      key={`emit-empresa-${empresa.id}`}
                      type="button"
                      className="w-full rounded px-2 py-1 text-left text-sm hover:bg-accent"
                      onClick={() => {
                        setSelectedEmpresa(empresa);
                        setEmpresaByCnpj(null);
                        setPrestadorCnpj(empresa.cnpj);
                        setEmpresaSearch(`${empresa.razaoSocial} (${empresa.cnpj})`);
                      }}
                    >
                      <span className="font-medium">{empresa.razaoSocial}</span> ({empresa.cnpj})
                    </button>
                  ))}
                </div>
              )}
              {canSearchEmpresa && !empresasLoading && filteredEmpresas.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma empresa encontrada.</p>
              )}
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

            {empresaSelecionada && (
              <p className="text-xs text-muted-foreground">
                Prestador selecionado: {empresaSelecionada.razaoSocial} ({empresaSelecionada.cnpj})
              </p>
            )}

            <div className="space-y-2">
              <Label>Referência Externa</Label>
              <div className="flex gap-2">
                <Input value={referenciaExterna} onChange={(ev) => setReferenciaExterna(ev.target.value)} required />
                <Button type="button" variant="outline" onClick={() => setReferenciaExterna(buildReferencia())}>Gerar</Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tomadorCpfCnpj">CPF/CNPJ Tomador</Label>
                <Input
                  id="tomadorCpfCnpj"
                  name="tomadorCpfCnpj"
                  autoComplete="off"
                  value={tomadorCpfCnpj}
                  onChange={(ev) => setTomadorCpfCnpj(ev.target.value)}
                  placeholder="Somente números"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tomadorRazaoSocial">Razão Social Tomador</Label>
                <Input
                  id="tomadorRazaoSocial"
                  name="tomadorRazaoSocial"
                  autoComplete="name"
                  value={tomadorRazaoSocial}
                  onChange={(ev) => setTomadorRazaoSocial(ev.target.value)}
                  required
                />
              </div>
            </div>

              <div className="space-y-2">
                <Label htmlFor="tomadorCep">CEP</Label>
                <Input
                  id="tomadorCep"
                  name="tomadorCep"
                  autoComplete="postal-code"
                  value={tomadorCep}
                  onChange={(ev) => setTomadorCep(formatCep(ev.target.value))}
                  placeholder="00000-000"
                  inputMode="numeric"
                />
              {tomadorCepDigits.length > 0 && tomadorCepDigits.length < 8 && (
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tomadorLogradouro">Logradouro Tomador</Label>
                <Input
                  id="tomadorLogradouro"
                  name="tomadorLogradouro"
                  autoComplete="address-line1"
                  value={tomadorLogradouro}
                  onChange={(ev) => setTomadorLogradouro(ev.target.value)}
                  placeholder="Rua, avenida..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tomadorNumero">Número</Label>
                <Input
                  id="tomadorNumero"
                  name="tomadorNumero"
                  autoComplete="address-line2"
                  value={tomadorNumero}
                  onChange={(ev) => setTomadorNumero(ev.target.value)}
                  placeholder="S/N"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tomadorBairro">Bairro</Label>
                <Input
                  id="tomadorBairro"
                  name="tomadorBairro"
                  autoComplete="address-level3"
                  value={tomadorBairro}
                  onChange={(ev) => setTomadorBairro(ev.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tomadorMunicipio">Município</Label>
                <Input
                  id="tomadorMunicipio"
                  name="tomadorMunicipio"
                  autoComplete="address-level2"
                  value={tomadorMunicipio}
                  onChange={(ev) => setTomadorMunicipio(ev.target.value)}
                  placeholder="Ex.: Manaus"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tomadorUf">UF</Label>
                <Input
                  id="tomadorUf"
                  name="tomadorUf"
                  autoComplete="address-level1"
                  value={tomadorUf}
                  onChange={(ev) => setTomadorUf(ev.target.value.toUpperCase())}
                  maxLength={2}
                  placeholder="AM"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição do Serviço</Label>
              <Textarea value={descricao} onChange={(ev) => setDescricao(ev.target.value)} required rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceSearch">Serviço (autocomplete)</Label>
              <Input
                id="serviceSearch"
                value={serviceSearch}
                onChange={(ev) => {
                  const next = ev.target.value;
                  setServiceSearch(next);
                  setCodigoNacional(extractServiceCode(next));
                }}
                placeholder="Digite código ou descrição do serviço"
              />
              {serviceQuery.isLoading && canSearchService && (
                <p className="text-sm text-muted-foreground">Buscando serviços...</p>
              )}
              {serviceQuery.isSuccess && (serviceQuery.data?.items?.length ?? 0) > 0 && (
                <div className="max-h-44 overflow-auto rounded-md border p-1">
                  {(serviceQuery.data?.items ?? []).map((item) => (
                    <button
                      key={`emit-service-${item.codigoServico}-${item.sequencial ?? ''}`}
                      type="button"
                      className="w-full rounded px-2 py-1 text-left text-sm hover:bg-accent"
                      onClick={() => {
                        setCodigoNacional(item.codigoServico);
                        setServiceSearch(`${item.codigoServico} - ${item.descricao}`);
                      }}
                    >
                      <span className="font-medium">{item.codigoServico}</span> - {item.descricao}
                    </button>
                  ))}
                </div>
              )}
              {serviceQuery.isFetched && !serviceQuery.isFetching && canSearchService && (serviceQuery.data?.items?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum serviço encontrado.</p>
              )}
              <p className="text-xs text-muted-foreground">
                {codigoNacionalClean.length === 6
                  ? `Código selecionado: ${codigoNacionalClean}`
                  : 'Selecione um item da lista ou digite o código com 6 dígitos.'}
              </p>
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
