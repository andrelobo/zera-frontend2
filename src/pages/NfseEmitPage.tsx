import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, AlertCircle, Loader2, FileOutput, Shield, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import PrestadorSection from '@/components/emissao/PrestadorSection';
import TomadorEmissao, { INITIAL_TOMADOR, type TomadorEmissaoData } from '@/components/emissao/TomadorEmissao';
import PrestacaoServicoSection, { type PrestacaoServicoData, type ListaServicoItem } from '@/components/emissao/PrestacaoServicoSection';
import LocalPrestacaoSection, { type LocalPrestacaoData } from '@/components/emissao/LocalPrestacaoSection';
import ParametrosTributariosSNCard from '@/components/emissao/ParametrosTributariosSNCard';
import ValoresTotaisSection from '@/components/emissao/ValoresTotaisSection';
import DANFSePrint from '@/components/emissao/DANFSePrint';
import { formatCNPJ, formatPhone, normalizeLogradouro, validateCNPJ, validateEmail } from '@/utils/validators';
import { empresasApi, nfseApi, tomadoresApi } from '@/services/api';
import type { EmitirNfseRequest, Empresa, Tomador } from '@/types/api';
import { mapFavoritosFromParametroMunicipal, mapListaServicoFromConfig, pickEmpresaForEmissao } from './nfseEmit.mappers';
import { resolveEmpresaTributacao, resolveIssAutomation, resolveParametroIssLabel } from './nfseEmit.tributacao';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { isReadOnlyRole } from '@/lib/roles';

interface PrestadorData {
  nomeEmpresarial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoMunicipal: string;
  inscricaoEstadual: string;
  suframa: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  localidadeUf: string;
  email: string;
  whatsapp: string;
}

const INITIAL_PRESTADOR: PrestadorData = {
  nomeEmpresarial: '',
  nomeFantasia: '',
  cnpj: '',
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

const INITIAL_PRESTACAO: PrestacaoServicoData = {
  codigoServico: '',
  descricaoServico: '',
  localPrestacao: '',
  valorServico: '',
  aliquota: '',
  baseCalculo: '',
  issRetido: false,
  desconto: '',
  retPis: '',
  retCofins: '',
  retCsll: '',
  retIr: '',
  retInss: '',
};

function parseCurrency(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}

function parseOptionalCurrency(value: string): number | undefined {
  if (!value || !value.trim()) return undefined;
  const parsed = parseFloat(value.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parsePercent(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(',', '.')) || 0;
}

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

const splitLocalidadeUf = (value: string) => {
  const [municipio, uf] = value.split('-').map((part) => part.trim());
  return { municipio: municipio || '', uf: (uf || '').toUpperCase() };
};

const buildReferencia = () => `nfse-front-${Date.now()}`;
const CODIGO_TRIBUTACAO_PADRAO = (import.meta.env.VITE_NFSE_CODIGO_TRIBUTACAO_PADRAO ?? '100').trim();

const getEmpresaOptionValue = (empresa: Empresa) => {
  const id = String(empresa.id || '').trim();
  if (id) return id;
  return String(empresa.cnpj || '').replace(/\D/g, '');
};

const mapPrestadorFromEmpresa = (empresa?: Empresa): PrestadorData => {
  if (!empresa) return INITIAL_PRESTADOR;
  const endereco = empresa.endereco || {};
  const cidade = String(endereco.cidade || endereco.descricaoCidade || '').trim();
  const uf = String(endereco.uf || endereco.estado || '').trim().toUpperCase();
  return {
    nomeEmpresarial: String(empresa.razaoSocial || '').trim(),
    nomeFantasia: String(empresa.nomeFantasia || '').trim(),
    cnpj: formatCNPJ(String(empresa.cnpj || '').trim()),
    inscricaoMunicipal: String(empresa.inscricaoMunicipal || '').trim(),
    inscricaoEstadual: String(empresa.inscricaoEstadual || '').trim(),
    suframa: String(empresa.suframa || '').trim(),
    cep: String(endereco.cep || '').trim(),
    logradouro: normalizeLogradouro(String(endereco.logradouro || '').trim()),
    numero: String(endereco.numero || '').trim(),
    complemento: String(endereco.complemento || '').trim(),
    bairro: String(endereco.bairro || '').trim(),
    localidadeUf: [cidade, uf].filter(Boolean).join(' - '),
    email: String(empresa.email || '').trim(),
    whatsapp: formatPhone(String(empresa.whatsapp || empresa.fone || '').trim()),
  };
};

const NfseEmitPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isReadOnly = isReadOnlyRole(user?.role || 'user');

  const [prestador, setPrestador] = useState<PrestadorData>(INITIAL_PRESTADOR);
  const [tomador, setTomador] = useState<TomadorEmissaoData>(INITIAL_TOMADOR);
  const [prestacao, setPrestacao] = useState<PrestacaoServicoData>(INITIAL_PRESTACAO);
  const [localPrestacao, setLocalPrestacao] = useState<LocalPrestacaoData>({ pais: 'Brasil', uf: 'AM', municipio: 'Manaus' });
  const [errors, setErrors] = useState<string[]>([]);
  const [tomadorSubstituto, setTomadorSubstituto] = useState(false);
  const [syncTomadorCadastro, setSyncTomadorCadastro] = useState(false);
  const [referenciaExterna] = useState(buildReferencia());
  const [empresaSelecionadaValue, setEmpresaSelecionadaValue] = useState('');
  const prestadorHydratedRef = useRef('');
  const empresaAnteriorRef = useRef('');
  const prestadorCnpjDigits = prestador.cnpj.replace(/\D/g, '');

  const autosave = useCallback(() => {}, []);

  const empresasQuery = useQuery({
    queryKey: ['empresas', 'emit-normal-options'],
    queryFn: () => empresasApi.list({ limit: 50 }),
    staleTime: 60_000,
  });

  const empresasDisponiveis = useMemo(() => empresasQuery.data || [], [empresasQuery.data]);
  const empresaOptions = useMemo(
    () => empresasDisponiveis.map((empresa) => ({
      value: getEmpresaOptionValue(empresa),
      empresa,
    })),
    [empresasDisponiveis],
  );
  const empresaSelecionadaResumo = useMemo(
    () => empresaOptions.find((option) => option.value === empresaSelecionadaValue)?.empresa || null,
    [empresaOptions, empresaSelecionadaValue],
  );

  useEffect(() => {
    if (empresasDisponiveis.length === 0) return;
    const currentStillExists = empresaOptions.some((option) => option.value === empresaSelecionadaValue);
    if (currentStillExists && empresaSelecionadaValue) return;
    const picked = pickEmpresaForEmissao(empresasDisponiveis) ?? empresasDisponiveis[0];
    if (!picked) return;
    setEmpresaSelecionadaValue(getEmpresaOptionValue(picked));
  }, [empresaOptions, empresaSelecionadaValue, empresasDisponiveis]);

  const empresaDetalheQuery = useQuery({
    queryKey: ['empresas', 'emit-normal-detail', empresaSelecionadaValue],
    queryFn: async () => {
      const selected = empresaSelecionadaResumo;
      if (!selected) return null;
      try {
        if (selected.id) {
          return await empresasApi.getById(selected.id);
        }
        const selectedCnpj = String(selected.cnpj || '').replace(/\D/g, '');
        if (selectedCnpj.length === 14) {
          return await empresasApi.getByCnpj(selectedCnpj);
        }
      } catch {
        return selected;
      }
      return selected;
    },
    enabled: Boolean(empresaSelecionadaResumo),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const empresaAtual = empresaDetalheQuery.data ?? empresaSelecionadaResumo ?? null;

  useEffect(() => {
    if (!empresaSelecionadaValue) return;
    if (!empresaAtual) return;
    if (prestadorHydratedRef.current === empresaSelecionadaValue) return;
    setPrestador(mapPrestadorFromEmpresa(empresaAtual));
    prestadorHydratedRef.current = empresaSelecionadaValue;
  }, [empresaAtual, empresaSelecionadaValue]);

  useEffect(() => {
    if (!empresaSelecionadaValue) return;
    if (!empresaAnteriorRef.current) {
      empresaAnteriorRef.current = empresaSelecionadaValue;
      return;
    }
    if (empresaAnteriorRef.current === empresaSelecionadaValue) return;
    empresaAnteriorRef.current = empresaSelecionadaValue;
    prestadorHydratedRef.current = '';
    setTomador(INITIAL_TOMADOR);
    setPrestacao(INITIAL_PRESTACAO);
    setErrors([]);
    setTomadorSubstituto(false);
    setSyncTomadorCadastro(false);
    toast({
      title: 'Prestador alterado',
      description: 'Tomador e serviço foram limpos para evitar mistura entre empresas.',
    });
  }, [empresaSelecionadaValue]);

  const tomadoresQuery = useQuery({
    queryKey: ['tomadores', 'emit-normal', prestadorCnpjDigits],
    queryFn: () => {
      if (prestadorCnpjDigits.length === 14) {
        return tomadoresApi.autocomplete({
          empresaCnpj: prestadorCnpjDigits,
          q: '',
          limit: 30,
        });
      }
      return [];
    },
    enabled: true,
    staleTime: 60_000,
  });

  const favoritos = useMemo(() => mapFavoritosFromParametroMunicipal(empresaAtual || undefined), [empresaAtual]);
  const listaServicoConfig = useMemo(() => mapListaServicoFromConfig(empresaAtual || undefined), [empresaAtual]);
  const empresaTributacao = useMemo(() => resolveEmpresaTributacao(empresaAtual), [empresaAtual]);
  const tomadorCadastradoAtual = useMemo(() => {
    const digits = tomador.cnpjCpf.replace(/\D/g, '');
    if (digits.length !== 11 && digits.length !== 14) return null;
    return (tomadoresQuery.data || []).find((item) => item.cpfCnpj.replace(/\D/g, '') === digits) || null;
  }, [tomador.cnpjCpf, tomadoresQuery.data]);

  const listaServico = useMemo<ListaServicoItem[]>(() => {
    return listaServicoConfig;
  }, [listaServicoConfig]);
  const simplesParametroIss = useMemo(
    () =>
      resolveIssAutomation({
        ...empresaTributacao,
        tomadorSubstituto,
        localMunicipio: localPrestacao.municipio,
        localUf: localPrestacao.uf,
        aliquotaAtual: prestacao.aliquota,
      }).parametroIssAplicado,
    [empresaTributacao, tomadorSubstituto, localPrestacao.municipio, localPrestacao.uf, prestacao.aliquota],
  );
  const parametroIssLabel = useMemo(() => resolveParametroIssLabel(simplesParametroIss), [simplesParametroIss]);
  const showParametroCard = empresaTributacao.optanteSimples && empresaTributacao.simplesAnexo === 'III';

  useEffect(() => {
    setSyncTomadorCadastro(Boolean(tomadorCadastradoAtual));
  }, [tomador.cnpjCpf, tomadorCadastradoAtual]);

  useEffect(() => {
    const tomadorDocDigits = tomadorCadastradoAtual?.cpfCnpj.replace(/\D/g, '') || '';
    const substituto = tomadorDocDigits.length === 11
      ? false
      : Boolean(tomadorCadastradoAtual?.substitutoTributario);
    setTomadorSubstituto((prev) => (prev === substituto ? prev : substituto));
    setPrestacao((prev) => {
      const automation = resolveIssAutomation({
        ...empresaTributacao,
        tomadorSubstituto: substituto,
        localMunicipio: localPrestacao.municipio,
        localUf: localPrestacao.uf,
        aliquotaAtual: prev.aliquota,
      });

      if (
        prev.issRetido === automation.issRetido &&
        prev.aliquota === automation.aliquota
      ) {
        return prev;
      }

      return {
        ...prev,
        ...automation,
      };
    });
  }, [empresaTributacao, localPrestacao.municipio, localPrestacao.uf, tomadorCadastradoAtual]);

  useEffect(() => {
    if (!empresaAtual) return;
    if (favoritos.length > 0 || listaServico.length > 0) return;
    if (empresaAtual) {
      toast({
        title: 'Prestador sem parâmetros municipais',
        description: 'Cadastre em Prestador > Parâmetros Municipais para habilitar Serviços Favoritos/Lista Serviço.',
      });
    }
  }, [empresaAtual, favoritos.length, listaServico.length]);

  const valores = useMemo(() => {
    const valorBruto = parseCurrency(prestacao.valorServico);
    const desconto = parseCurrency(prestacao.desconto);
    const aliquota = parsePercent(prestacao.aliquota);
    const baseCalculo = valorBruto - desconto;
    const issValor = baseCalculo * (aliquota / 100);

    return {
      valorBruto,
      desconto,
      baseCalculo,
      issValor,
      retPis: parseCurrency(prestacao.retPis),
      retCofins: parseCurrency(prestacao.retCofins),
      retCsll: parseCurrency(prestacao.retCsll),
      retIr: parseCurrency(prestacao.retIr),
      retInss: parseCurrency(prestacao.retInss),
    };
  }, [prestacao]);

  const handlePrestacaoChange = (newData: PrestacaoServicoData) => {
    const valorBruto = parseCurrency(newData.valorServico);
    const desconto = parseCurrency(newData.desconto);
    const baseCalculo = valorBruto - desconto;
    setPrestacao({
      ...newData,
      baseCalculo: baseCalculo > 0
        ? baseCalculo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '',
    });
  };

  const validar = (): string[] => {
    const erros: string[] = [];
    if (!validateCNPJ(prestador.cnpj)) erros.push('CNPJ do prestador é obrigatório/inválido.');
    if (!tomador.cnpjCpf) erros.push('CPF/CNPJ do tomador é obrigatório.');
    if (!tomador.nomeRazaoSocial) erros.push('Nome/Razão Social do tomador é obrigatório.');
    if (tomador.cep.replace(/\D/g, '').length !== 8) erros.push('CEP do tomador é obrigatório.');
    if (!tomador.logradouro.trim()) erros.push('Logradouro do tomador é obrigatório.');
    if (!tomador.numero.trim()) erros.push('Número do tomador é obrigatório.');
    if (!tomador.bairro.trim()) erros.push('Bairro do tomador é obrigatório.');
    if (tomador.email && !validateEmail(tomador.email)) erros.push('E-mail do tomador inválido.');
    if (!prestacao.codigoServico) erros.push('Código do serviço é obrigatório.');
    if (!prestacao.descricaoServico) erros.push('Descrição do serviço é obrigatória.');
    if (!prestacao.valorServico || parseCurrency(prestacao.valorServico) <= 0) erros.push('Valor do serviço deve ser maior que zero.');
    if (!prestacao.aliquota && !(empresaTributacao.optanteSimples && !tomadorSubstituto)) erros.push('Alíquota é obrigatória.');
    return erros;
  };

  const emitMutation = useMutation({
    mutationFn: (payload: EmitirNfseRequest) => nfseApi.emitir(payload),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['nfse'] });
      toast({ title: 'NFSe enviada', description: `Emissão: ${result.emissionId}. Acompanhe o status na listagem.` });
      navigate('/nfse');
    },
  });

  const handleTomadorSelecionado = useCallback((t: Tomador) => {
    const municipio = t.endereco?.municipio || '';
    const uf = (t.endereco?.uf || '').toUpperCase();
    setTomador((prev) => ({
      ...prev,
      cnpjCpf: formatDoc(t.cpfCnpj || ''),
      nomeRazaoSocial: t.razaoSocial || prev.nomeRazaoSocial,
      inscricaoMunicipal: t.inscricaoMunicipal || '',
      email: t.email || '',
      cep: t.endereco?.cep || '',
      logradouro: normalizeLogradouro(t.endereco?.logradouro || ''),
      numero: t.endereco?.numero || '',
      complemento: t.endereco?.complemento || '',
      bairro: t.endereco?.bairro || '',
      localidadeUf: [municipio, uf].filter(Boolean).join(' - '),
      pais: 'Brasil',
    }));
  }, []);

  const handleEmitir = async () => {
    if (isReadOnly) {
      toast({ title: 'Acesso somente leitura', description: 'Este perfil pode visualizar, mas não emitir DANFSE.', variant: 'destructive' });
      return;
    }

    const erros = validar();
    setErrors(erros);
    if (erros.length > 0) {
      toast({ title: 'Corrija os erros', description: 'Revise os campos obrigatórios antes de emitir.', variant: 'destructive' });
      return;
    }

    const prestadorLocal = splitLocalidadeUf(prestador.localidadeUf);
    const tomadorLocal = splitLocalidadeUf(tomador.localidadeUf);

    const payload: EmitirNfseRequest = {
      parametroIssAplicado: simplesParametroIss || undefined,
      syncTomadorCadastro,
      localPrestacao: {
        pais: localPrestacao.pais || undefined,
        uf: localPrestacao.uf || undefined,
        municipio: localPrestacao.municipio || undefined,
      },
      prestador: {
        cnpj: prestador.cnpj.replace(/\D/g, ''),
        inscricaoMunicipal: prestador.inscricaoMunicipal || undefined,
        razaoSocial: prestador.nomeEmpresarial || undefined,
        endereco: {
          logradouro: prestador.logradouro || undefined,
          numero: prestador.numero || undefined,
          bairro: prestador.bairro || undefined,
          municipio: prestadorLocal.municipio || undefined,
          uf: prestadorLocal.uf || undefined,
          cep: prestador.cep.replace(/\D/g, '') || undefined,
        },
      },
      tomador: {
        cpfCnpj: tomador.cnpjCpf.replace(/\D/g, ''),
        razaoSocial: tomador.nomeRazaoSocial,
        inscricaoMunicipal: tomador.inscricaoMunicipal || undefined,
        email: tomador.email || undefined,
        endereco: {
          logradouro: tomador.logradouro || undefined,
          numero: tomador.numero || undefined,
          bairro: tomador.bairro || undefined,
          municipio: tomadorLocal.municipio || localPrestacao.municipio || undefined,
          uf: tomadorLocal.uf || localPrestacao.uf || undefined,
          cep: tomador.cep.replace(/\D/g, '') || undefined,
        },
      },
      servico: {
        codigoNacional: prestacao.codigoServico.replace(/\D/g, '').slice(0, 6),
        codigoTributacao: CODIGO_TRIBUTACAO_PADRAO || undefined,
        descricao: prestacao.descricaoServico,
        valor: parseCurrency(prestacao.valorServico),
        baseCalculo: parseOptionalCurrency(prestacao.baseCalculo),
        desconto: parseOptionalCurrency(prestacao.desconto),
        retencoesFederais: {
          pis: parseOptionalCurrency(prestacao.retPis),
          cofins: parseOptionalCurrency(prestacao.retCofins),
          csll: parseOptionalCurrency(prestacao.retCsll),
          ir: parseOptionalCurrency(prestacao.retIr),
          inss: parseOptionalCurrency(prestacao.retInss),
        },
        iss: {
          retido: prestacao.issRetido,
          aliquota: prestacao.aliquota?.trim() ? parsePercent(prestacao.aliquota) : undefined,
        },
      },
      referenciaExterna,
    };

    emitMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10 no-print">
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
            <button onClick={handleEmitir} disabled={emitMutation.isPending || isReadOnly} className="btn-primary flex items-center gap-2 text-sm py-2">
              {emitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileOutput className="w-4 h-4" />}
              <span className="hidden sm:inline">{isReadOnly ? 'Somente leitura' : 'Emitir'}</span>
            </button>
          </div>
        </div>
      </header>

      {errors.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 no-print">
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Corrija os seguintes erros:</span>
            </div>
            <ul className="list-disc list-inside text-sm text-destructive/80 space-y-1">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-2 no-print">
        {isReadOnly ? (
          <Alert>
            <AlertTitle>Acesso somente leitura</AlertTitle>
            <AlertDescription>Este perfil pode acompanhar a DANFSE, mas não pode emitir notas.</AlertDescription>
          </Alert>
        ) : null}
        <div className="section-card">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="section-title !mb-0">Contexto do Prestador</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prestadorEmitSelect">Empresa prestadora</Label>
            <Select value={empresaSelecionadaValue} onValueChange={setEmpresaSelecionadaValue}>
              <SelectTrigger id="prestadorEmitSelect">
                <SelectValue placeholder={empresasQuery.isLoading ? 'Carregando prestadores...' : 'Selecione o prestador'} />
              </SelectTrigger>
              <SelectContent>
                {empresaOptions.map(({ value, empresa }) => (
                  <SelectItem key={value} value={value}>
                    {`${empresa.razaoSocial} (${formatCNPJ(String(empresa.cnpj || '').replace(/\D/g, ''))})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              A emissão, os tomadores e os serviços abaixo seguem o prestador selecionado.
            </p>
          </div>
        </div>
        <PrestadorSection
          data={prestador}
          onChange={setPrestador}
          onAutosave={autosave}
          compact
          optanteSimples={empresaAtual?.opcaoPeloSimples ?? null}
          lockCnpj
        />

        <TomadorEmissao
          data={tomador}
          onChange={setTomador}
          onTomadorSelecionado={handleTomadorSelecionado}
          tomadores={tomadoresQuery.data || []}
          loadingTomadores={tomadoresQuery.isLoading}
          syncTomadorCadastro={syncTomadorCadastro}
          onSyncTomadorCadastroChange={setSyncTomadorCadastro}
        />

        <LocalPrestacaoSection data={localPrestacao} onChange={setLocalPrestacao} />

        <PrestacaoServicoSection
          data={prestacao}
          onChange={handlePrestacaoChange}
          mostrarRetencoesFederais={true}
          optanteSimples={Boolean(empresaAtual?.opcaoPeloSimples)}
          tomadorSubstituto={tomadorSubstituto}
          favoritos={favoritos}
          listaServico={listaServico}
        />

        {showParametroCard && (
          <ParametrosTributariosSNCard
            value={simplesParametroIss}
            disabled={false}
          />
        )}

        {parametroIssLabel && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm text-foreground">
              <span className="font-medium">Parametro Tributario Aplicado:</span> {parametroIssLabel}
            </span>
          </div>
        )}

        <ValoresTotaisSection
          valorBruto={valores.valorBruto}
          desconto={valores.desconto}
          issValor={valores.issValor}
          issRetido={prestacao.issRetido}
          retPis={valores.retPis}
          retCofins={valores.retCofins}
          retCsll={valores.retCsll}
          retIr={valores.retIr}
          retInss={valores.retInss}
        />
      </main>

      <DANFSePrint
        data={{
          prestador: {
            cnpj: prestador.cnpj,
            inscricaoMunicipal: prestador.inscricaoMunicipal,
            nomeEmpresarial: prestador.nomeEmpresarial,
            nomeFantasia: prestador.nomeFantasia,
          },
          tomador: {
            cnpjCpf: tomador.cnpjCpf,
            nomeRazaoSocial: tomador.nomeRazaoSocial,
            inscricaoMunicipal: tomador.inscricaoMunicipal,
            email: tomador.email,
            logradouro: tomador.logradouro,
            numero: tomador.numero,
            complemento: tomador.complemento,
            bairro: tomador.bairro,
            localidadeUf: tomador.localidadeUf,
            cep: tomador.cep,
          },
          localPrestacao,
          servico: {
            codigoServico: prestacao.codigoServico,
            descricaoServico: prestacao.descricaoServico,
            valorServico: prestacao.valorServico,
            aliquota: prestacao.aliquota,
            baseCalculo: prestacao.baseCalculo,
            desconto: prestacao.desconto,
            issRetido: prestacao.issRetido,
          },
          valores,
        }}
      />
    </div>
  );
};

export default NfseEmitPage;
