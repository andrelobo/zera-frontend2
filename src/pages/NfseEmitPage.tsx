import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, AlertCircle, Printer, Loader2, FileOutput } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import PrestadorSection from '@/components/emissao/PrestadorSection';
import TomadorEmissao, { INITIAL_TOMADOR, type TomadorEmissaoData } from '@/components/emissao/TomadorEmissao';
import PrestacaoServicoSection, { type PrestacaoServicoData, type ListaServicoItem } from '@/components/emissao/PrestacaoServicoSection';
import LocalPrestacaoSection, { type LocalPrestacaoData } from '@/components/emissao/LocalPrestacaoSection';
import ValoresTotaisSection from '@/components/emissao/ValoresTotaisSection';
import DANFSePrint from '@/components/emissao/DANFSePrint';
import { formatCNPJ, formatPhone, normalizeLogradouro, validateCNPJ, validateEmail } from '@/utils/validators';
import { getCTNByCode } from '@/utils/ctn-data';
import { empresasApi, nfseApi, tomadoresApi } from '@/services/api';
import type { EmitirNfseRequest, Empresa, Tomador } from '@/types/api';
import { hasFavoriteConfig, mapFavoritosFromParametroMunicipal, mapListaServicoFromConfig, pickEmpresaForEmissao } from './nfseEmit.mappers';

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

const splitLocalidadeUf = (value: string) => {
  const [municipio, uf] = value.split('-').map((part) => part.trim());
  return { municipio: municipio || '', uf: (uf || '').toUpperCase() };
};

const pickServicoFromFavorito = (favorito?: { vinculos?: Array<{ ctn?: string; ctnDescricao?: string }> }) => {
  const vinculo = favorito?.vinculos?.find((item) => Boolean(item?.ctn));
  if (!vinculo?.ctn) return null;
  const entry = getCTNByCode(vinculo.ctn);
  return {
    codigoServico: vinculo.ctn.replace(/\D/g, '').slice(0, 6),
    descricaoServico: String(entry?.descricao || vinculo.ctnDescricao || '').trim(),
  };
};

const buildReferencia = () => `nfse-front-${Date.now()}`;
const CODIGO_TRIBUTACAO_PADRAO = (import.meta.env.VITE_NFSE_CODIGO_TRIBUTACAO_PADRAO ?? '100').trim();

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

  const [prestador, setPrestador] = useState<PrestadorData>(INITIAL_PRESTADOR);
  const [tomador, setTomador] = useState<TomadorEmissaoData>(INITIAL_TOMADOR);
  const [prestacao, setPrestacao] = useState<PrestacaoServicoData>(INITIAL_PRESTACAO);
  const [localPrestacao, setLocalPrestacao] = useState<LocalPrestacaoData>({ pais: 'Brasil', uf: 'AM', municipio: 'Manaus' });
  const [tomadorServicos, setTomadorServicos] = useState<Array<{ codigoServico: string; descricaoServico: string }>>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [tomadorSubstituto, setTomadorSubstituto] = useState(false);
  const [referenciaExterna] = useState(buildReferencia());
  const prestadorHydratedRef = useRef(false);
  const prestadorCnpjDigits = prestador.cnpj.replace(/\D/g, '');

  const autosave = useCallback(() => {}, []);

  const empresaQuery = useQuery({
    queryKey: ['empresas', 'emit-normal'],
    queryFn: async () => {
      const list = await empresasApi.list();
      return pickEmpresaForEmissao(list) ?? null;
    },
    staleTime: 60_000,
  });

  const empresaAtual = empresaQuery.data ?? null;

  useEffect(() => {
    if (prestadorHydratedRef.current) return;
    if (!empresaAtual) return;
    setPrestador(mapPrestadorFromEmpresa(empresaAtual));
    prestadorHydratedRef.current = true;
  }, [empresaAtual]);

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
      return tomadoresApi.list();
    },
    enabled: true,
    staleTime: 60_000,
  });

  const favoritos = useMemo(() => mapFavoritosFromParametroMunicipal(empresaAtual || undefined), [empresaAtual]);
  const favoritosCadastro = useMemo(() => mapFavoritosFromParametroMunicipal(empresaAtual || undefined), [empresaAtual]);
  const listaServicoConfig = useMemo(() => mapListaServicoFromConfig(empresaAtual || undefined), [empresaAtual]);

  const listaServico = useMemo<ListaServicoItem[]>(() => {
    return listaServicoConfig;
  }, [listaServicoConfig]);

  useEffect(() => {
    if (!empresaAtual) return;
    if (hasFavoriteConfig(empresaAtual)) return;
    if (empresaQuery.isSuccess) {
      toast({
        title: 'Prestador sem parâmetros municipais',
        description: 'Cadastre em Prestador > Parâmetros Municipais para habilitar Serviços Favoritos/Lista Serviço.',
      });
    }
  }, [empresaAtual, empresaQuery.isSuccess]);

  const favoritosTomador = useMemo(() => {
    return tomadorServicos.map((item) => ({
      codigo: item.codigoServico,
      cnaeDescricao: `[Tomador] ${item.descricaoServico}`,
      lc116Item: '',
      vinculos: [{
        ctn: item.codigoServico,
        ctnDescricao: String(getCTNByCode(item.codigoServico)?.descricao || item.descricaoServico || '').trim(),
      }],
    }));
  }, [tomadorServicos]);

  const favoritosCombinados = useMemo(() => {
    const seen = new Set<string>();
    const combined = [...favoritosTomador, ...favoritos].filter((item) => {
      const key = item.codigo.replace(/\D/g, '').slice(0, 6);
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return combined;
  }, [favoritosTomador, favoritos]);

  const servicoFavoritoPadrao = useMemo(() => {
    // Regra UX: autopreencher apenas com favorito REAL salvo em Parametros Municipais.
    return pickServicoFromFavorito(favoritosCadastro[0]);
  }, [favoritosCadastro]);

  useEffect(() => {
    if (!servicoFavoritoPadrao) return;
    setPrestacao((prev) => {
      const codigoAtual = String(prev.codigoServico || '').replace(/\D/g, '').slice(0, 6);
      const codigoFavorito = String(servicoFavoritoPadrao.codigoServico || '').replace(/\D/g, '').slice(0, 6);
      if (codigoAtual && codigoAtual !== codigoFavorito) return prev;
      if (codigoAtual === codigoFavorito && String(prev.descricaoServico || '').trim() === String(servicoFavoritoPadrao.descricaoServico || '').trim()) {
        return prev;
      }
      return {
        ...prev,
        codigoServico: servicoFavoritoPadrao.codigoServico,
        descricaoServico: servicoFavoritoPadrao.descricaoServico,
      };
    });
  }, [servicoFavoritoPadrao]);

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
    if (tomador.email && !validateEmail(tomador.email)) erros.push('E-mail do tomador inválido.');
    if (!prestacao.codigoServico) erros.push('Código do serviço é obrigatório.');
    if (!prestacao.descricaoServico) erros.push('Descrição do serviço é obrigatória.');
    if (!prestacao.valorServico || parseCurrency(prestacao.valorServico) <= 0) erros.push('Valor do serviço deve ser maior que zero.');
    return erros;
  };

  const emitMutation = useMutation({
    mutationFn: (payload: EmitirNfseRequest) => nfseApi.emitir(payload),
    onSuccess: (result) => {
      toast({ title: 'NFSe enviada', description: `Emissão: ${result.emissionId}. Acompanhe o status na listagem.` });
      navigate('/nfse');
    },
  });

  const handleTomadorSelecionado = useCallback((t: Tomador) => {
    const municipio = t.endereco?.municipio || '';
    const uf = (t.endereco?.uf || '').toUpperCase();
    const substituto = Boolean(t.substitutoTributario);
    setTomadorSubstituto(substituto);
    setPrestacao((prev) => ({
      ...prev,
      issRetido: substituto ? true : false,
      aliquota: substituto ? prev.aliquota : '',
    }));
    setTomador((prev) => ({
      ...prev,
      cnpjCpf: t.cpfCnpj,
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
    setTomadorServicos(
      (t.servicos || [])
        .map((item) => ({
          codigoServico: item.codigoServico?.replace(/\D/g, '').slice(0, 6) || '',
          descricaoServico: item.descricaoServico || '',
        }))
        .filter((item) => item.codigoServico && item.descricaoServico),
    );
  }, []);

  const handleEmitir = async () => {
    const erros = validar();
    setErrors(erros);
    if (erros.length > 0) {
      toast({ title: 'Corrija os erros', description: 'Revise os campos obrigatórios antes de emitir.', variant: 'destructive' });
      return;
    }

    const prestadorLocal = splitLocalidadeUf(prestador.localidadeUf);
    const tomadorLocal = splitLocalidadeUf(tomador.localidadeUf);

    const payload: EmitirNfseRequest = {
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
        tributacaoTotal: {
          federal: { valor: parseCurrency(prestacao.retPis) + parseCurrency(prestacao.retCofins) + parseCurrency(prestacao.retCsll) + parseCurrency(prestacao.retIr) },
          municipal: { valor: parseCurrency(prestacao.retInss) },
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
            <button type="button" onClick={() => window.print()} className="btn-outline flex items-center gap-2 text-sm py-2">
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Visualizar</span>
            </button>
            <button onClick={handleEmitir} disabled={emitMutation.isPending} className="btn-primary flex items-center gap-2 text-sm py-2">
              {emitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileOutput className="w-4 h-4" />}
              <span className="hidden sm:inline">Emitir</span>
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
          onChange={(next) => {
            const previousDoc = tomador.cnpjCpf.replace(/\D/g, '');
            const nextDoc = next.cnpjCpf.replace(/\D/g, '');
            if (previousDoc !== nextDoc) {
              setTomadorServicos([]);
            }
            setTomador(next);
          }}
          onTomadorSelecionado={handleTomadorSelecionado}
          tomadores={tomadoresQuery.data || []}
          loadingTomadores={tomadoresQuery.isLoading}
        />

        <LocalPrestacaoSection data={localPrestacao} onChange={setLocalPrestacao} />

        <PrestacaoServicoSection
          data={prestacao}
          onChange={handlePrestacaoChange}
          mostrarRetencoesFederais={true}
          optanteSimples={Boolean(empresaAtual?.opcaoPeloSimples)}
          tomadorSubstituto={tomadorSubstituto}
          favoritos={favoritosCombinados}
          listaServico={listaServico}
        />

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
