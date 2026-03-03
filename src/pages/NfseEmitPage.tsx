import React, { useState, useMemo, useCallback } from 'react';
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
import { validateCNPJ, validateEmail } from '@/utils/validators';
import { nfseApi, tomadoresApi } from '@/services/api';
import type { EmitirNfseRequest, Tomador } from '@/types/api';

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

function parsePercent(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(',', '.')) || 0;
}

const splitLocalidadeUf = (value: string) => {
  const [municipio, uf] = value.split('-').map((part) => part.trim());
  return { municipio: municipio || '', uf: (uf || '').toUpperCase() };
};

const buildReferencia = () => `nfse-front-${Date.now()}`;
const CODIGO_TRIBUTACAO_PADRAO = (import.meta.env.VITE_NFSE_CODIGO_TRIBUTACAO_PADRAO ?? '100').trim();
const TODAY_ISO = new Date().toISOString().slice(0, 10);

const NfseEmitPage: React.FC = () => {
  const navigate = useNavigate();

  const [prestador, setPrestador] = useState<PrestadorData>(INITIAL_PRESTADOR);
  const [tomador, setTomador] = useState<TomadorEmissaoData>(INITIAL_TOMADOR);
  const [prestacao, setPrestacao] = useState<PrestacaoServicoData>(INITIAL_PRESTACAO);
  const [localPrestacao, setLocalPrestacao] = useState<LocalPrestacaoData>({ pais: 'Brasil', uf: 'AM', municipio: 'Manaus' });
  const [errors, setErrors] = useState<string[]>([]);
  const [referenciaExterna] = useState(buildReferencia());
  const [competencia, setCompetencia] = useState('01/2026');
  const [dataEmissao, setDataEmissao] = useState(TODAY_ISO);
  const [nfseNumero, setNfseNumero] = useState('');
  const prestadorCnpjDigits = prestador.cnpj.replace(/\D/g, '');

  const autosave = useCallback(() => {}, []);

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

  const servicosQuery = useQuery({
    queryKey: ['servicos', 'emit-normal', prestadorCnpjDigits],
    queryFn: async () => {
      const result = await nfseApi.servicosList({ limit: 200, page: 1 }, { skipGlobalErrorToast: true });
      return result.items || [];
    },
    staleTime: 60_000,
  });

  const listaServico = useMemo<ListaServicoItem[]>(() => {
    return (servicosQuery.data || []).map((item, index) => ({
      id: `${item.codigoServico}-${index}`,
      natureza: item.codigoServico,
      descricao: item.descricao,
      codigoServico: item.codigoServico,
    }));
  }, [servicosQuery.data]);

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
    setTomador((prev) => ({
      ...prev,
      cnpjCpf: t.cpfCnpj,
      nomeRazaoSocial: t.razaoSocial || prev.nomeRazaoSocial,
      inscricaoMunicipal: t.inscricaoMunicipal || '',
      email: t.email || '',
      cep: t.endereco?.cep || '',
      logradouro: t.endereco?.logradouro || '',
      numero: t.endereco?.numero || '',
      complemento: t.endereco?.complemento || '',
      bairro: t.endereco?.bairro || '',
      localidadeUf: [municipio, uf].filter(Boolean).join(' - '),
      pais: 'Brasil',
    }));
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
      numeroNfse: nfseNumero || undefined,
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
        iss: {
          retido: prestacao.issRetido,
          aliquota: prestacao.issRetido ? parsePercent(prestacao.aliquota) : undefined,
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
        <div className="section-card p-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="field-label">Competência</label>
              <input
                className="field-input"
                type="text"
                placeholder="mm/aaaa"
                maxLength={7}
                value={competencia}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                  const next = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
                  setCompetencia(next);
                }}
              />
            </div>
            <div>
              <label className="field-label">Data de Emissão</label>
              <input
                className="field-input"
                type="date"
                value={dataEmissao}
                onChange={(e) => setDataEmissao(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">NFS-e Nº</label>
              <input
                className="field-input"
                type="text"
                placeholder="Número"
                inputMode="numeric"
                value={nfseNumero}
                onChange={(e) => setNfseNumero(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>
        </div>

        <PrestadorSection
          data={prestador}
          onChange={setPrestador}
          onAutosave={autosave}
          compact
          optanteSimples={null}
        />

        <TomadorEmissao
          data={tomador}
          onChange={setTomador}
          onTomadorSelecionado={handleTomadorSelecionado}
          tomadores={tomadoresQuery.data || []}
          loadingTomadores={tomadoresQuery.isLoading}
        />

        <LocalPrestacaoSection data={localPrestacao} onChange={setLocalPrestacao} />

        <PrestacaoServicoSection
          data={prestacao}
          onChange={handlePrestacaoChange}
          mostrarRetencoesFederais={true}
          optanteSimples={false}
          tomadorSubstituto={false}
          favoritos={(servicosQuery.data || []).map((item) => ({
            codigo: item.codigoServico,
            cnaeDescricao: item.descricao,
            lc116Item: item.itemLc116 || '',
            vinculos: [{ ctn: item.codigoServico, ctnDescricao: item.descricao }],
          }))}
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
