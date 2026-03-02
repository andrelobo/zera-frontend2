import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Building2, FileOutput, Loader2, MapPin, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { empresasApi, nfseApi, tomadoresApi } from '@/services/api';
import { formatCep, lookupCep, normalizeCep } from '@/services/cep';
import type { EmitirNfseRequest, Empresa, Tomador } from '@/types/api';
import LocalPrestacaoSection, { type LocalPrestacaoData } from '@/components/emissao/LocalPrestacaoSection';
import ValoresTotaisSection from '@/components/emissao/ValoresTotaisSection';
import ServicoAutocomplete from '@/components/emissao/ServicoAutocomplete';

const MIN_AUTOCOMPLETE_CHARS = 2;
const buildReferencia = () => `nfse-front-${Date.now()}`;
const extractServiceCode = (value: string) => value.replace(/\D/g, '').slice(0, 6);
const CODIGO_TRIBUTACAO_PADRAO = (import.meta.env.VITE_NFSE_CODIGO_TRIBUTACAO_PADRAO ?? '100').trim();

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

const formatAliquotaFromCatalog = (raw: unknown) => {
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    const parsed = Number(trimmed.replace(/\./g, '').replace(',', '.'));
    if (Number.isFinite(parsed)) {
      return parsed.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return trimmed;
  }
  return '';
};

const getServicoAliquota = (item: Record<string, unknown>) => {
  const candidates = [
    item.aliquotaIss,
    item.aliquota,
    item.aliquotaSimplesNacional,
    item.aliquota_simples_nacional,
  ];
  for (const candidate of candidates) {
    const value = formatAliquotaFromCatalog(candidate);
    if (value) return value;
  }
  return '';
};

const parsePercent = (value: string) => {
  if (!value) return undefined;
  const normalized = Number(value.replace(',', '.'));
  if (!Number.isFinite(normalized)) return undefined;
  return normalized;
};

const getDocDigits = (value: string) => value.replace(/\D/g, '');
const getTomadorDocType = (value: string): 'cpf' | 'cnpj' | 'unknown' => {
  const digits = getDocDigits(value);
  if (digits.length === 11) return 'cpf';
  if (digits.length === 14) return 'cnpj';
  return 'unknown';
};

const NfseEmitPage = () => {
  const navigate = useNavigate();

  const [referenciaExterna] = useState(buildReferencia());

  const [empresaSearch, setEmpresaSearch] = useState('');
  const [empresaSearchDebounced, setEmpresaSearchDebounced] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);

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

  const [localPrestacao, setLocalPrestacao] = useState<LocalPrestacaoData>({
    pais: 'Brasil',
    uf: 'AM',
    municipio: 'Manaus',
  });

  const [descricao, setDescricao] = useState('');
  const [codigoNacional, setCodigoNacional] = useState('171901');
  const [serviceSearch, setServiceSearch] = useState('');

  const [valorServico, setValorServico] = useState('');
  const [desconto, setDesconto] = useState('');
  const [aliquota, setAliquota] = useState('');
  const [issRetido, setIssRetido] = useState(false);
  const [retPis, setRetPis] = useState('');
  const [retCofins, setRetCofins] = useState('');
  const [retCsll, setRetCsll] = useState('');
  const [retIr, setRetIr] = useState('');
  const [retInss, setRetInss] = useState('');

  const [errors, setErrors] = useState<string[]>([]);
  const tomadorDocDigits = useMemo(() => getDocDigits(tomadorCpfCnpj), [tomadorCpfCnpj]);
  const tomadorDocType = useMemo(() => getTomadorDocType(tomadorCpfCnpj), [tomadorCpfCnpj]);
  const tomadorIsCpf = tomadorDocType === 'cpf';
  const tomadorIsCnpj = tomadorDocType === 'cnpj';

  useEffect(() => {
    if (!tomadorIsCnpj && tomadorInscricaoMunicipal) {
      setTomadorInscricaoMunicipal('');
    }
  }, [tomadorIsCnpj, tomadorInscricaoMunicipal]);

  useEffect(() => {
    const timer = setTimeout(() => setEmpresaSearchDebounced(empresaSearch), 250);
    return () => clearTimeout(timer);
  }, [empresaSearch]);

  const canSearchEmpresa = empresaSearchDebounced.trim().length >= MIN_AUTOCOMPLETE_CHARS;
  const empresasQuery = useQuery({
    queryKey: ['empresas', 'emit-normal', empresaSearchDebounced],
    queryFn: () => empresasApi.list({ q: empresaSearchDebounced, limit: 8 }),
    enabled: canSearchEmpresa,
    staleTime: 60_000,
  });

  const tomadoresQuery = useQuery({
    queryKey: ['tomadores', 'emit-normal', selectedEmpresa?.cnpj],
    queryFn: () => tomadoresApi.autocomplete({
      empresaCnpj: selectedEmpresa!.cnpj,
      q: '',
      limit: 30,
    }),
    enabled: Boolean(selectedEmpresa?.cnpj),
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
    const valorBruto = parseCurrency(valorServico);
    const descontoValor = parseCurrency(desconto);
    const baseCalculo = Math.max(0, valorBruto - descontoValor);
    const taxRate = parsePercent(aliquota) || 0;
    const issValor = baseCalculo * (taxRate / 100);
    return {
      valorBruto,
      desconto: descontoValor,
      baseCalculo,
      issValor,
      retPis: parseCurrency(retPis),
      retCofins: parseCurrency(retCofins),
      retCsll: parseCurrency(retCsll),
      retIr: parseCurrency(retIr),
      retInss: parseCurrency(retInss),
    };
  }, [aliquota, desconto, issRetido, retCofins, retCsll, retInss, retIr, retPis, valorServico]);

  const emitMutation = useMutation({
    mutationFn: (payload: EmitirNfseRequest) => nfseApi.emitir(payload),
    onSuccess: (result) => {
      toast({ title: 'NFSe enviada', description: `Emissão: ${result.emissionId}. Acompanhe o status na listagem.` });
      navigate('/nfse');
    },
  });

  const applyTomador = (tomador: Tomador) => {
    setSelectedTomador(tomador);
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
    if (!selectedEmpresa?.endereco?.logradouro) found.push('Logradouro do prestador é obrigatório.');
    if (!selectedEmpresa?.endereco?.numero) found.push('Número do prestador é obrigatório.');
    if (!selectedEmpresa?.endereco?.bairro) found.push('Bairro do prestador é obrigatório.');
    if (!(selectedEmpresa?.endereco?.cidade || selectedEmpresa?.endereco?.descricaoCidade)) found.push('Município do prestador é obrigatório.');
    if (!(selectedEmpresa?.endereco?.uf || selectedEmpresa?.endereco?.estado)) found.push('UF do prestador é obrigatória.');
    if (!selectedEmpresa?.endereco?.cep) found.push('CEP do prestador é obrigatório.');
    if (tomadorDocDigits.length !== 11 && tomadorDocDigits.length !== 14) {
      found.push('CPF/CNPJ do tomador deve ter 11 (CPF) ou 14 (CNPJ) dígitos.');
    }
    if (!tomadorRazaoSocial.trim()) {
      found.push(tomadorIsCpf ? 'Nome do tomador é obrigatório.' : 'Razão social do tomador é obrigatória.');
    }
    if (!tomadorLogradouro.trim()) found.push('Logradouro do tomador é obrigatório.');
    if (!tomadorNumero.trim()) found.push('Número do tomador é obrigatório.');
    if (!tomadorBairro.trim()) found.push('Bairro do tomador é obrigatório.');
    if (!(tomadorMunicipio.trim() || localPrestacao.municipio.trim())) found.push('Município do tomador é obrigatório.');
    if (!(tomadorUf.trim() || localPrestacao.uf.trim())) found.push('UF do tomador é obrigatória.');
    if (!normalizeCep(tomadorCep)) found.push('CEP do tomador é obrigatório.');
    if (!descricao.trim()) found.push('Descrição do serviço é obrigatória.');
    if (codigoNacional.replace(/\D/g, '').length !== 6) found.push('Código nacional do serviço deve ter 6 dígitos.');
    if (valores.valorBruto <= 0) found.push('Valor do serviço deve ser maior que zero.');
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
        inscricaoMunicipal: tomadorIsCnpj ? (tomadorInscricaoMunicipal || undefined) : undefined,
        email: tomadorEmail || undefined,
        endereco: {
          logradouro: tomadorLogradouro || undefined,
          numero: tomadorNumero || undefined,
          bairro: tomadorBairro || undefined,
          municipio: tomadorMunicipio || localPrestacao.municipio || undefined,
          uf: tomadorUf || localPrestacao.uf || undefined,
          cep: normalizeCep(tomadorCep) || undefined,
        },
      },
      servico: {
        codigoNacional: codigoNacional.replace(/\D/g, ''),
        codigoTributacao: CODIGO_TRIBUTACAO_PADRAO || undefined,
        descricao,
        valor: valores.valorBruto,
        iss: {
          retido: issRetido,
          // Simples Nacional sem retencao: nao enviar aliquota para evitar rejeicao E0625.
          aliquota: issRetido ? parsePercent(aliquota) : undefined,
        },
        tributacaoTotal: {
          federal: {
            valor: parseCurrency(retPis) + parseCurrency(retCofins) + parseCurrency(retCsll) + parseCurrency(retIr),
          },
          municipal: {
            valor: parseCurrency(retInss),
          },
        },
      },
      referenciaExterna,
    };

    emitMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/nfse')} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">DANFSE</h1>
              <p className="text-xs text-muted-foreground">Nota Fiscal de Serviços Eletrônica</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" className="btn-outline flex items-center gap-2 text-sm py-2">
              <FileOutput className="w-4 h-4" />
              <span className="hidden sm:inline">Visualizar</span>
            </button>
            <button type="button" onClick={() => window.print()} className="btn-outline flex items-center gap-2 text-sm py-2">
              <FileOutput className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>
      </header>

      {errors.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Corrija os seguintes erros:</span>
            </div>
            <ul className="list-disc list-inside text-sm text-destructive/90 space-y-1">
              {errors.map((err) => <li key={err}>{err}</li>)}
            </ul>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-3">
      <form id="nfse-normal-form" onSubmit={handleSubmit} className="space-y-3">
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
              Tomador(a)
              <span className="section-subtitle block">Dados do tomador para emissão</span>
            </span>
          </h2>

          {selectedEmpresa && (tomadoresQuery.data?.length || 0) > 0 && (
            <div className="mb-4">
              <Label className="field-label">Tomadores Cadastrados</Label>
              <div className="max-h-44 overflow-auto rounded-md border p-1 mt-2">
                {(tomadoresQuery.data || []).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`w-full rounded px-2 py-1 text-left text-sm hover:bg-accent ${
                      selectedTomador?.id === item.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => applyTomador(item)}
                  >
                    <span className="font-medium">{item.razaoSocial}</span> ({formatDoc(item.cpfCnpj)})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="field-label">CPF/CNPJ *</Label>
              <Input
                className="field-input"
                value={tomadorCpfCnpj}
                onChange={(e) => setTomadorCpfCnpj(formatDoc(e.target.value))}
                placeholder={tomadorDocDigits.length > 11 ? '00.000.000/0000-00' : '000.000.000-00'}
                maxLength={18}
                required
              />
            </div>
            <div>
              <Label className="field-label">{tomadorIsCpf ? 'Nome Completo *' : 'Razão Social *'}</Label>
              <Input
                className="field-input"
                value={tomadorRazaoSocial}
                onChange={(e) => setTomadorRazaoSocial(e.target.value)}
                required
              />
            </div>
            {tomadorIsCnpj && (
              <div>
                <Label className="field-label">Inscrição Municipal</Label>
                <Input
                  className="field-input"
                  value={tomadorInscricaoMunicipal}
                  onChange={(e) => setTomadorInscricaoMunicipal(e.target.value)}
                />
              </div>
            )}
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
              Serviço Prestado
              <span className="section-subtitle block">Autocomplete de serviços via backend</span>
            </span>
          </h2>
          <div className="mb-4">
            <ServicoAutocomplete
              queryScope="emit-normal"
              helperClassName="text-xs"
              value={serviceSearch}
              selectedCode={codigoNacional.replace(/\D/g, '')}
              onValueChange={(next) => {
                setServiceSearch(next);
                setCodigoNacional(extractServiceCode(next));
              }}
              onSelect={(item) => {
                setCodigoNacional(item.codigoServico);
                setServiceSearch(`${item.codigoServico} - ${item.descricao}`);
                setDescricao(item.descricao || '');
                const aliquotaCatalog = getServicoAliquota(item as unknown as Record<string, unknown>);
                if (aliquotaCatalog) setAliquota(aliquotaCatalog);
              }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="field-label">Código Tributação Nacional*</Label>
              <Input className="field-input" value={codigoNacional} onChange={(e) => setCodigoNacional(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
            </div>
            <div>
              <Label className="field-label">Alíquota %</Label>
              <Input
                className="field-input"
                value={aliquota}
                onChange={(e) => setAliquota(e.target.value.replace(/[^\d,]/g, ''))}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="mt-4">
            <Label className="field-label">Descrição do Serviço *</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} required />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <Label className="field-label">Valor do Serviço (R$)*</Label>
              <Input
                className="field-input text-right"
                value={valorServico}
                onChange={(e) => setValorServico(formatCurrencyInput(e.target.value))}
                placeholder="0,00"
                required
              />
            </div>
            <div>
              <Label className="field-label">Desconto (R$)</Label>
              <Input
                className="field-input text-right"
                value={desconto}
                onChange={(e) => setDesconto(formatCurrencyInput(e.target.value))}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label className="field-label">PIS (R$)</Label>
              <Input className="field-input text-right" value={retPis} onChange={(e) => setRetPis(formatCurrencyInput(e.target.value))} placeholder="0,00" />
            </div>
            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <Checkbox checked={issRetido} onCheckedChange={(checked) => setIssRetido(Boolean(checked))} />
                ISS Retido
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <Label className="field-label">COFINS (R$)</Label>
              <Input className="field-input text-right" value={retCofins} onChange={(e) => setRetCofins(formatCurrencyInput(e.target.value))} placeholder="0,00" />
            </div>
            <div>
              <Label className="field-label">CSLL (R$)</Label>
              <Input className="field-input text-right" value={retCsll} onChange={(e) => setRetCsll(formatCurrencyInput(e.target.value))} placeholder="0,00" />
            </div>
            <div>
              <Label className="field-label">IR (R$)</Label>
              <Input className="field-input text-right" value={retIr} onChange={(e) => setRetIr(formatCurrencyInput(e.target.value))} placeholder="0,00" />
            </div>
            <div>
              <Label className="field-label">INSS (R$)</Label>
              <Input className="field-input text-right" value={retInss} onChange={(e) => setRetInss(formatCurrencyInput(e.target.value))} placeholder="0,00" />
            </div>
          </div>
        </div>

        <LocalPrestacaoSection data={localPrestacao} onChange={setLocalPrestacao} />

        <ValoresTotaisSection
          valorBruto={valores.valorBruto}
          desconto={valores.desconto}
          issValor={valores.issValor}
          issRetido={issRetido}
          retPis={valores.retPis}
          retCofins={valores.retCofins}
          retCsll={valores.retCsll}
          retIr={valores.retIr}
          retInss={valores.retInss}
        />

        <div className="section-card">
          <div className="flex justify-end">
            <button type="submit" disabled={emitMutation.isPending} className="btn-primary flex items-center gap-2 text-sm py-2">
              {emitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Emitir</span>
            </button>
          </div>
        </div>
      </form>
      </main>
    </div>
  );
};

export default NfseEmitPage;
