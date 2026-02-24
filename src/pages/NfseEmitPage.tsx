import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Building2, FileOutput, Loader2, MapPin, Percent, Printer, Search, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { empresasApi, nfseApi, tomadoresApi } from '@/services/api';
import { formatCep, lookupCep, normalizeCep } from '@/services/cep';
import type { EmitirNfseRequest, Empresa, Tomador } from '@/types/api';

const MIN_AUTOCOMPLETE_CHARS = 2;
const buildReferencia = () => `nfse-front-${Date.now()}`;

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

const parseCurrency = (value: string) => {
  if (!value) return 0;
  return Number(value.replace(/\./g, '').replace(',', '.')) || 0;
};

const formatCurrencyInput = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const normalized = (Number(digits) / 100).toFixed(2);
  const [intPart, decPart] = normalized.split('.');
  return `${Number(intPart).toLocaleString('pt-BR')},${decPart}`;
};

const parsePercent = (value: string) => {
  if (!value) return undefined;
  const normalized = Number(value.replace(',', '.'));
  if (!Number.isFinite(normalized)) return undefined;
  return normalized;
};

const NfseEmitPage = () => {
  const navigate = useNavigate();

  const [referenciaExterna] = useState(buildReferencia());

  const [empresaSearch, setEmpresaSearch] = useState('');
  const [empresaSearchDebounced, setEmpresaSearchDebounced] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);

  const [tomadorSearch, setTomadorSearch] = useState('');
  const [tomadorSearchDebounced, setTomadorSearchDebounced] = useState('');
  const [selectedTomador, setSelectedTomador] = useState<Tomador | null>(null);

  const [tomadorCpfCnpj, setTomadorCpfCnpj] = useState('');
  const [tomadorRazaoSocial, setTomadorRazaoSocial] = useState('');
  const [tomadorInscricaoMunicipal, setTomadorInscricaoMunicipal] = useState('');
  const [tomadorEmail, setTomadorEmail] = useState('');
  const [tomadorCep, setTomadorCep] = useState('');
  const [tomadorLogradouro, setTomadorLogradouro] = useState('');
  const [tomadorNumero, setTomadorNumero] = useState('');
  const [tomadorBairro, setTomadorBairro] = useState('');
  const [tomadorMunicipio, setTomadorMunicipio] = useState('');
  const [tomadorUf, setTomadorUf] = useState('');

  const [localPrestacaoPais] = useState('Brasil');
  const [localPrestacaoUf, setLocalPrestacaoUf] = useState('AM');
  const [localPrestacaoMunicipio, setLocalPrestacaoMunicipio] = useState('Manaus');

  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceSearchDebounced, setServiceSearchDebounced] = useState('');
  const [descricao, setDescricao] = useState('');
  const [codigoNacional, setCodigoNacional] = useState('171901');

  const [valorServico, setValorServico] = useState('');
  const [desconto, setDesconto] = useState('');
  const [aliquota, setAliquota] = useState('');
  const [issRetido, setIssRetido] = useState(false);

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setEmpresaSearchDebounced(empresaSearch), 250);
    return () => clearTimeout(timer);
  }, [empresaSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setTomadorSearchDebounced(tomadorSearch), 250);
    return () => clearTimeout(timer);
  }, [tomadorSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setServiceSearchDebounced(serviceSearch), 250);
    return () => clearTimeout(timer);
  }, [serviceSearch]);

  const canSearchEmpresa = empresaSearchDebounced.trim().length >= MIN_AUTOCOMPLETE_CHARS;
  const empresasQuery = useQuery({
    queryKey: ['empresas', 'emit-normal', empresaSearchDebounced],
    queryFn: () => empresasApi.list({ q: empresaSearchDebounced, limit: 8 }),
    enabled: canSearchEmpresa,
    staleTime: 60_000,
  });

  const canSearchTomador = tomadorSearchDebounced.trim().length >= MIN_AUTOCOMPLETE_CHARS && Boolean(selectedEmpresa?.cnpj);
  const tomadoresQuery = useQuery({
    queryKey: ['tomadores', 'emit-normal', selectedEmpresa?.cnpj, tomadorSearchDebounced],
    queryFn: () => tomadoresApi.autocomplete({
      empresaCnpj: selectedEmpresa!.cnpj,
      q: tomadorSearchDebounced,
      limit: 8,
    }),
    enabled: canSearchTomador,
    staleTime: 60_000,
  });

  const canSearchService = serviceSearchDebounced.trim().length >= MIN_AUTOCOMPLETE_CHARS;
  const servicesQuery = useQuery({
    queryKey: ['nfse-services', 'emit-normal', serviceSearchDebounced],
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

  const tomadorCepDigits = useMemo(() => normalizeCep(tomadorCep), [tomadorCep]);
  const cepLookupQuery = useQuery({
    queryKey: ['cep-lookup', 'nfse-normal', tomadorCepDigits],
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

  const valores = useMemo(() => {
    const bruto = parseCurrency(valorServico);
    const discount = parseCurrency(desconto);
    const base = Math.max(0, bruto - discount);
    const taxRate = parsePercent(aliquota) || 0;
    const iss = base * (taxRate / 100);
    const liquido = Math.max(0, base - (issRetido ? iss : 0));
    return { bruto, discount, base, iss, liquido };
  }, [aliquota, desconto, issRetido, valorServico]);

  const emitMutation = useMutation({
    mutationFn: (payload: EmitirNfseRequest) => nfseApi.emitir(payload),
    onSuccess: (result) => {
      toast({ title: 'NFSe enviada', description: `Emissão: ${result.emissionId}` });
      navigate(`/nfse/${result.emissionId}`);
    },
  });

  const applyTomador = (tomador: Tomador) => {
    setSelectedTomador(tomador);
    setTomadorSearch(`${tomador.razaoSocial} (${formatDoc(tomador.cpfCnpj)})`);
    setTomadorCpfCnpj(formatDoc(tomador.cpfCnpj));
    setTomadorRazaoSocial(tomador.razaoSocial);
    setTomadorInscricaoMunicipal(tomador.inscricaoMunicipal || '');
    setTomadorEmail(tomador.email || '');
    setTomadorCep(formatCep(tomador.endereco?.cep || ''));
    setTomadorLogradouro(tomador.endereco?.logradouro || '');
    setTomadorNumero(tomador.endereco?.numero || '');
    setTomadorBairro(tomador.endereco?.bairro || '');
    setTomadorMunicipio(tomador.endereco?.municipio || '');
    setTomadorUf((tomador.endereco?.uf || '').toUpperCase());
  };

  const validar = () => {
    const found: string[] = [];
    if (!selectedEmpresa) found.push('Selecione a empresa emissora.');
    if (tomadorCpfCnpj.replace(/\D/g, '').length < 11) found.push('CPF/CNPJ do tomador é obrigatório.');
    if (!tomadorRazaoSocial.trim()) found.push('Razão social do tomador é obrigatória.');
    if (!descricao.trim()) found.push('Descrição do serviço é obrigatória.');
    if (codigoNacional.replace(/\D/g, '').length !== 6) found.push('Código nacional do serviço deve ter 6 dígitos.');
    if (valores.bruto <= 0) found.push('Valor do serviço deve ser maior que zero.');
    return found;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validar();
    setErrors(found);
    if (found.length > 0 || !selectedEmpresa) {
      toast({
        title: 'Corrija os erros',
        description: 'Revise os campos obrigatórios antes de emitir.',
        variant: 'destructive',
      });
      return;
    }

    const payload: EmitirNfseRequest = {
      prestador: {
        cnpj: selectedEmpresa.cnpj,
        inscricaoMunicipal: selectedEmpresa.inscricaoMunicipal,
        razaoSocial: selectedEmpresa.razaoSocial,
        regimeTributarioSn: {
          opSimpNac: 3,
          regApTribSN: 1,
          regEspTrib: 0,
        },
        endereco: {
          logradouro: selectedEmpresa.endereco?.logradouro,
          numero: selectedEmpresa.endereco?.numero,
          bairro: selectedEmpresa.endereco?.bairro,
          municipio: selectedEmpresa.endereco?.cidade || selectedEmpresa.endereco?.descricaoCidade,
          uf: selectedEmpresa.endereco?.uf || selectedEmpresa.endereco?.estado,
          cep: selectedEmpresa.endereco?.cep,
        },
      },
      tomador: {
        cpfCnpj: tomadorCpfCnpj.replace(/\D/g, ''),
        razaoSocial: tomadorRazaoSocial,
        inscricaoMunicipal: tomadorInscricaoMunicipal || undefined,
        endereco: {
          logradouro: tomadorLogradouro || undefined,
          numero: tomadorNumero || undefined,
          bairro: tomadorBairro || undefined,
          municipio: tomadorMunicipio || localPrestacaoMunicipio || undefined,
          uf: tomadorUf || localPrestacaoUf || undefined,
          cep: normalizeCep(tomadorCep) || undefined,
        },
      },
      servico: {
        codigoNacional: codigoNacional.replace(/\D/g, ''),
        descricao,
        valor: valores.bruto,
        iss: {
          retido: issRetido,
          aliquota: parsePercent(aliquota),
        },
      },
      referenciaExterna,
    };

    emitMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/nfse')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">DANFSE</h1>
            <p className="text-sm text-muted-foreground">Emissão normal de NFSe (não é emissão rápida)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Visualizar
          </Button>
          <Button type="submit" form="nfse-normal-form" disabled={emitMutation.isPending}>
            {emitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileOutput className="mr-2 h-4 w-4" />}
            Emitir
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Corrija os seguintes erros:</span>
          </div>
          <ul className="list-disc list-inside text-sm text-destructive/90 space-y-1">
            {errors.map((err) => <li key={err}>{err}</li>)}
          </ul>
        </div>
      )}

      <form id="nfse-normal-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="section-card">
          <h2 className="section-title">
            <span className="section-title-icon section-title-icon-primary">
              <Building2 className="w-4 h-4" />
            </span>
            <span>
              O Prestador
              <span className="section-subtitle block">Autocomplete via backend</span>
            </span>
          </h2>

          <div className="space-y-2">
            <Label className="field-label">Empresa Emissora</Label>
            <Input
              className="field-input"
              value={empresaSearch}
              onChange={(e) => {
                setEmpresaSearch(e.target.value);
                setSelectedEmpresa(null);
              }}
              placeholder="Digite razão social ou CNPJ"
            />
            {canSearchEmpresa && empresasQuery.isLoading && (
              <p className="text-xs text-muted-foreground">Buscando empresas...</p>
            )}
            {canSearchEmpresa && (empresasQuery.data?.length || 0) > 0 && (
              <div className="max-h-44 overflow-auto rounded-md border p-1">
                {(empresasQuery.data || []).map((empresa) => (
                  <button
                    key={empresa.id}
                    type="button"
                    className="w-full rounded px-2 py-1 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      setSelectedEmpresa(empresa);
                      setEmpresaSearch(`${empresa.razaoSocial} (${empresa.cnpj})`);
                    }}
                  >
                    <span className="font-medium">{empresa.razaoSocial}</span> ({empresa.cnpj})
                  </button>
                ))}
              </div>
            )}
            {selectedEmpresa && (
              <p className="text-xs text-muted-foreground">
                Selecionada: {selectedEmpresa.razaoSocial} ({selectedEmpresa.cnpj})
              </p>
            )}
          </div>
        </div>

        <div className="section-card">
          <h2 className="section-title">
            <span className="section-title-icon section-title-icon-secondary">
              <Users className="w-4 h-4" />
            </span>
            <span>
              O Tomador
              <span className="section-subtitle block">Autocomplete via backend por empresa</span>
            </span>
          </h2>

          <div className="space-y-2 mb-4">
            <Label className="field-label">Buscar tomador</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="field-input pl-8"
                value={tomadorSearch}
                onChange={(e) => {
                  setTomadorSearch(e.target.value);
                  setSelectedTomador(null);
                }}
                placeholder={selectedEmpresa ? 'Digite nome ou CPF/CNPJ' : 'Selecione a empresa primeiro'}
                disabled={!selectedEmpresa}
              />
            </div>
            {canSearchTomador && tomadoresQuery.isLoading && (
              <p className="text-xs text-muted-foreground">Buscando tomadores...</p>
            )}
            {canSearchTomador && (tomadoresQuery.data?.length || 0) > 0 && (
              <div className="max-h-44 overflow-auto rounded-md border p-1">
                {(tomadoresQuery.data || []).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full rounded px-2 py-1 text-left text-sm hover:bg-accent"
                    onClick={() => applyTomador(item)}
                  >
                    <span className="font-medium">{item.razaoSocial}</span> ({formatDoc(item.cpfCnpj)})
                  </button>
                ))}
              </div>
            )}
            {selectedTomador && (
              <p className="text-xs text-muted-foreground">Tomador selecionado do cadastro.</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="field-label">CPF/CNPJ *</Label>
              <Input
                className="field-input"
                value={tomadorCpfCnpj}
                onChange={(e) => setTomadorCpfCnpj(formatDoc(e.target.value))}
                placeholder="000.000.000-00"
                required
              />
            </div>
            <div>
              <Label className="field-label">Razão Social *</Label>
              <Input
                className="field-input"
                value={tomadorRazaoSocial}
                onChange={(e) => setTomadorRazaoSocial(e.target.value)}
                required
              />
            </div>
            <div>
              <Label className="field-label">Inscrição Municipal</Label>
              <Input
                className="field-input"
                value={tomadorInscricaoMunicipal}
                onChange={(e) => setTomadorInscricaoMunicipal(e.target.value)}
              />
            </div>
            <div>
              <Label className="field-label">E-mail</Label>
              <Input
                className="field-input"
                value={tomadorEmail}
                onChange={(e) => setTomadorEmail(e.target.value)}
                type="email"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_2fr_0.8fr] mt-4">
            <div>
              <Label className="field-label">CEP</Label>
              <Input
                className="field-input"
                value={tomadorCep}
                onChange={(e) => setTomadorCep(formatCep(e.target.value))}
                placeholder="00000-000"
              />
            </div>
            <div>
              <Label className="field-label">Logradouro</Label>
              <Input className="field-input" value={tomadorLogradouro} onChange={(e) => setTomadorLogradouro(e.target.value)} />
            </div>
            <div>
              <Label className="field-label">Número</Label>
              <Input className="field-input" value={tomadorNumero} onChange={(e) => setTomadorNumero(e.target.value)} />
            </div>
            <div>
              <Label className="field-label">Bairro</Label>
              <Input className="field-input" value={tomadorBairro} onChange={(e) => setTomadorBairro(e.target.value)} />
            </div>
            <div>
              <Label className="field-label">Município</Label>
              <Input className="field-input" value={tomadorMunicipio} onChange={(e) => setTomadorMunicipio(e.target.value)} />
            </div>
            <div>
              <Label className="field-label">UF</Label>
              <Input className="field-input" value={tomadorUf} onChange={(e) => setTomadorUf(e.target.value.toUpperCase())} maxLength={2} />
            </div>
          </div>
        </div>

        <div className="section-card">
          <h2 className="section-title">
            <span className="section-title-icon section-title-icon-accent">
              <MapPin className="w-4 h-4" />
            </span>
            <span>
              Local da Prestação
              <span className="section-subtitle block">Informação complementar do DANFSE</span>
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="field-label">País</Label>
              <Input className="field-input" value={localPrestacaoPais} readOnly />
            </div>
            <div>
              <Label className="field-label">UF</Label>
              <Input className="field-input" value={localPrestacaoUf} onChange={(e) => setLocalPrestacaoUf(e.target.value.toUpperCase())} maxLength={2} />
            </div>
            <div>
              <Label className="field-label">Município</Label>
              <Input className="field-input" value={localPrestacaoMunicipio} onChange={(e) => setLocalPrestacaoMunicipio(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="section-card">
          <h2 className="section-title">
            <span className="section-title-icon section-title-icon-primary">
              <Send className="w-4 h-4" />
            </span>
            <span>
              Prestação do Serviço
              <span className="section-subtitle block">Autocomplete de serviços via backend</span>
            </span>
          </h2>

          <div className="space-y-2 mb-4">
            <Label className="field-label">Buscar serviço</Label>
            <Input
              className="field-input"
              value={serviceSearch}
              onChange={(e) => {
                setServiceSearch(e.target.value);
                const digits = e.target.value.replace(/\D/g, '');
                if (digits.length >= 6) setCodigoNacional(digits.slice(0, 6));
              }}
              placeholder="Código ou descrição"
            />
            {canSearchService && servicesQuery.isLoading && (
              <p className="text-xs text-muted-foreground">Buscando serviços...</p>
            )}
            {canSearchService && (servicesQuery.data?.items?.length || 0) > 0 && (
              <div className="max-h-44 overflow-auto rounded-md border p-1">
                {(servicesQuery.data?.items || []).map((item) => (
                  <button
                    key={`${item.codigoServico}-${item.sequencial ?? ''}`}
                    type="button"
                    className="w-full rounded px-2 py-1 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      setCodigoNacional(item.codigoServico);
                      setServiceSearch(`${item.codigoServico} - ${item.descricao}`);
                      if (!descricao.trim()) setDescricao(item.descricao);
                    }}
                  >
                    <span className="font-medium">{item.codigoServico}</span> - {item.descricao}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="field-label">Código Nacional *</Label>
              <Input className="field-input" value={codigoNacional} onChange={(e) => setCodigoNacional(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
            </div>
          </div>

          <div className="mt-4">
            <Label className="field-label">Descrição do Serviço *</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} required />
          </div>
        </div>

        <div className="section-card">
          <h2 className="section-title">
            <span className="section-title-icon section-title-icon-secondary">
              <Percent className="w-4 h-4" />
            </span>
            <span>
              Valores Totais
              <span className="section-subtitle block">Cálculo operacional da nota</span>
            </span>
          </h2>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <Label className="field-label">Valor do Serviço (R$) *</Label>
              <Input
                className="field-input"
                value={valorServico}
                onChange={(e) => setValorServico(formatCurrencyInput(e.target.value))}
                placeholder="0,00"
                required
              />
            </div>
            <div>
              <Label className="field-label">Desconto (R$)</Label>
              <Input
                className="field-input"
                value={desconto}
                onChange={(e) => setDesconto(formatCurrencyInput(e.target.value))}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label className="field-label">Alíquota ISS (%)</Label>
              <Input
                className="field-input"
                value={aliquota}
                onChange={(e) => setAliquota(e.target.value.replace(/[^\d,]/g, ''))}
                placeholder="0,00"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <Checkbox checked={issRetido} onCheckedChange={(checked) => setIssRetido(Boolean(checked))} />
                ISS Retido
              </label>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4 mt-4 text-sm">
            <div className="rounded-lg border bg-muted/40 px-3 py-2">Base: {valores.base.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            <div className="rounded-lg border bg-muted/40 px-3 py-2">ISS: {valores.iss.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            <div className="rounded-lg border bg-muted/40 px-3 py-2">Desconto: {valores.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            <div className="rounded-lg border bg-muted/40 px-3 py-2 font-semibold">Líquido: {valores.liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          </div>
        </div>

      </form>
    </div>
  );
};

export default NfseEmitPage;
