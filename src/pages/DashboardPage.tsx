import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import ErrorState from '@/components/ErrorState';
import LoadingState from '@/components/LoadingState';
import StatusBadge from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { empresasApi, nfseApi } from '@/services/api';
import {
  getNfsePrestadorDocumento,
  getNfsePrestadorNome,
  getNfseTomadorDocumento,
  getNfseTomadorNome,
  getNfseValor,
} from '@/lib/nfse';
import { AlertTriangle, ArrowRight, Building2, CheckCircle2, Receipt, Rocket, ShieldAlert } from 'lucide-react';

const metricCardClass =
  'rounded-[28px] border border-white/60 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur';

const formatCnpj = (value?: string | null) => {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.length !== 14) return value || 'CNPJ pendente';
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

const getPrestadoraReadiness = (empresa: any) => {
  const hasCertificate = Boolean(
    empresa?.providerCertificadoId ||
      empresa?.certificado?.nomeArquivo ||
      empresa?.certificado?.fileName ||
      empresa?.certificado?.arquivo,
  );
  const hasInscricaoMunicipal = Boolean(empresa?.inscricaoMunicipal);
  const hasCodigoMunicipio = Boolean(
    empresa?.endereco?.codigoMunicipio ||
      empresa?.providerData?.endereco?.municipio?.codigo_ibge ||
      empresa?.providerData?.endereco?.codigoCidade,
  );
  const hasConfiguracaoNfse = Boolean(
    empresa?.plugNotasNfse?.ativoNfseNacional ||
      empresa?.configOperacionais?.length ||
      empresa?.serieDpsNum ||
      empresa?.dpsNum,
  );

  const score = [hasCertificate, hasInscricaoMunicipal, hasCodigoMunicipio, hasConfiguracaoNfse].filter(Boolean)
    .length;

  if (score >= 4) {
    return {
      tone: 'ready' as const,
      label: 'Pronta para operar',
      notes: [
        'Certificado presente',
        'Inscrição municipal preenchida',
        'Município operacional resolvido',
        'Configuração NFS-e preparada',
      ],
    };
  }

  if (score >= 2) {
    return {
      tone: 'attention' as const,
      label: 'Exige revisão',
      notes: [
        hasCertificate ? 'Certificado presente' : 'Certificado pendente',
        hasInscricaoMunicipal ? 'IM salva' : 'IM pendente',
        hasCodigoMunicipio ? 'Município resolvido' : 'Código do município pendente',
        hasConfiguracaoNfse ? 'Configuração fiscal presente' : 'Configuração fiscal precisa revisão',
      ],
    };
  }

  return {
    tone: 'onboarding' as const,
    label: 'Em onboarding',
    notes: ['Cadastro ainda longe da prontidão ideal', 'Revisar certificado, IM, município e configuração NFS-e'],
  };
};

const DashboardPage = () => {
  const empresasQuery = useQuery({
    queryKey: ['empresas', 'dashboard-header'],
    queryFn: () => empresasApi.list({ limit: 24 }),
    staleTime: 60_000,
  });

  const nfseQuery = useQuery({
    queryKey: ['nfse-dashboard-list-v3', 'home-entry'],
    queryFn: () =>
      nfseApi.list({
        page: 1,
        limit: 10,
        sort: 'createdAt',
        order: 'DESC',
      }),
    staleTime: 60_000,
  });

  const empresas = ((empresasQuery.data || []) as any[]).filter(Boolean);
  const notas = nfseQuery.data?.data || [];

  const prestadoras = useMemo(
    () =>
      empresas.map((empresa) => ({
        id: empresa?.id || empresa?._id || empresa?.cnpj,
        razaoSocial: empresa?.razaoSocial || 'Prestadora sem razão social',
        nomeFantasia: empresa?.nomeFantasia || null,
        cnpj: empresa?.cnpj || '',
        readiness: getPrestadoraReadiness(empresa),
      })),
    [empresas],
  );

  const totalPrestadoras = prestadoras.length;
  const prontas = prestadoras.filter((item) => item.readiness.tone === 'ready').length;
  const emAtencao = prestadoras.filter((item) => item.readiness.tone === 'attention').length;
  const onboarding = prestadoras.filter((item) => item.readiness.tone === 'onboarding').length;

  const prestadorasComEmissaoRecente = new Set(
    notas
      .map((nota) => getNfsePrestadorDocumento(nota))
      .map((value) => (value || '').replace(/\D/g, ''))
      .filter(Boolean),
  ).size;

  const notasAutorizadas = notas.filter((nota) => nota.status === 'AUTHORIZED').length;
  const notasProcessando = notas.filter((nota) => nota.status === 'PENDING' || nota.status === 'PROCESSING').length;
  const notasComErro = notas.filter((nota) => nota.status === 'ERROR' || nota.status === 'REJECTED').length;

  const prioridades = [
    onboarding > 0
      ? {
          title: 'Concluir onboarding das prestadoras pendentes',
          copy: `${onboarding} empresa(s) ainda precisam de ajuste antes de operar com confiança.`,
          href: '/empresas',
          tone: 'rose',
        }
      : null,
    emAtencao > 0
      ? {
          title: 'Revisar prestadoras em atenção',
          copy: `${emAtencao} empresa(s) já estão próximas, mas ainda pedem revisão operacional.`,
          href: '/empresas',
          tone: 'amber',
        }
      : null,
    notasComErro > 0
      ? {
          title: 'Atacar emissões com erro ou rejeição',
          copy: `${notasComErro} emissão(ões) recente(s) pedem leitura mais cuidadosa da fila operacional.`,
          href: '/nfse',
          tone: 'rose',
        }
      : null,
    notas.length === 0
      ? {
          title: 'Abrir a primeira emissão desta leitura',
          copy: 'Ainda não há emissões recentes suficientes nesta home; vale usar a DANFSE completa para iniciar o pulso operacional.',
          href: '/nfse/nova',
          tone: 'sky',
        }
      : null,
  ].filter(Boolean) as Array<{ title: string; copy: string; href: string; tone: 'rose' | 'amber' | 'sky' }>

  if (empresasQuery.isLoading) return <LoadingState />;
  if (empresasQuery.isError && prestadoras.length === 0) {
    return <ErrorState onRetry={() => empresasQuery.refetch()} />;
  }

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_28%),radial-gradient(circle_at_85%_12%,_rgba(14,165,233,0.14),_transparent_24%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_52%,_#f8fbff_100%)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[34px] border border-white/60 bg-[linear-gradient(135deg,_#0f172a_0%,_#12326d_58%,_#2563eb_100%)] px-6 py-8 text-white shadow-[0_30px_90px_rgba(15,23,42,0.28)] sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              <Badge variant="outline" className="border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.26em] text-white/85">
                Home operacional
              </Badge>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
                  Bem-vindo ao ZERA multi-prestador.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                  Esta entrada nova troca o painel apertado por uma visão consolidada do que importa agora: prestadoras prontas, pendências de onboarding e o pulso das últimas emissões.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-white px-5 text-slate-950 hover:bg-slate-100">
                  <Link to="/nfse/nova">
                    Nova DANFSE <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-white/20 bg-white/10 px-5 text-white hover:bg-white/15 hover:text-white">
                  <Link to="/nfse/rapida">
                    Emissão rápida <Rocket className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-white/20 bg-transparent px-5 text-white hover:bg-white/10 hover:text-white">
                  <Link to="/dashboard-classico">
                    Dashboard clássico
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-100/85">Prestadoras</div>
                <div className="mt-3 text-4xl font-semibold text-white">{totalPrestadoras}</div>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Base operacional cadastrada no ZERA.
                </p>
              </div>
              <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/85">Prontas</div>
                <div className="mt-3 text-4xl font-semibold text-white">{prontas}</div>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Melhor sinal de prontidão para emissão.
                </p>
              </div>
              <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/85">Em revisão</div>
                <div className="mt-3 text-4xl font-semibold text-white">{emAtencao}</div>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Pedem ajuste antes de ganhar confiança operacional.
                </p>
              </div>
              <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-100/85">Com emissão recente</div>
                <div className="mt-3 text-4xl font-semibold text-white">{prestadorasComEmissaoRecente}</div>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Prestadoras vistas nas últimas notas monitoradas. {onboarding} ainda estão em onboarding.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className={metricCardClass}>
            <CardHeader className="pb-4">
              <CardDescription className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                Panorama de prestadoras
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950">
                Quem já está pronta e quem ainda pede cuidado
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {prestadoras.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
                  Ainda não há prestadoras suficientes para compor esta leitura consolidada.
                </div>
              ) : (
                prestadoras.map((prestadora) => (
                  <div key={prestadora.id} className="rounded-[26px] border border-slate-200 bg-slate-50/90 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-950">{prestadora.razaoSocial}</h3>
                          <span
                            className={[
                              'rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
                              prestadora.readiness.tone === 'ready'
                                ? 'bg-emerald-100 text-emerald-700'
                                : prestadora.readiness.tone === 'attention'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-rose-100 text-rose-700',
                            ].join(' ')}
                          >
                            {prestadora.readiness.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          {prestadora.nomeFantasia || 'Sem nome fantasia'} · {formatCnpj(prestadora.cnpj)}
                        </p>
                      </div>

                      <Button asChild variant="outline" className="rounded-full">
                        <Link to="/empresas">
                          Revisar cadastro <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {prestadora.readiness.notes.map((note) => (
                        <div
                          key={note}
                          className="rounded-2xl border border-white bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm"
                        >
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className={metricCardClass}>
              <CardHeader className="pb-4">
                <CardDescription className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  Últimas emissões
                </CardDescription>
                <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950">
                  Leitura rápida do que acabou de acontecer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {nfseQuery.isLoading ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                    Carregando últimas emissões...
                  </div>
                ) : notas.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                    Ainda não há emissões recentes para esta visão.
                  </div>
                ) : (
                  notas.map((nota) => (
                    <div key={nota.id} className="rounded-[24px] border border-slate-200 bg-slate-50/90 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="truncate text-sm font-semibold text-slate-950">
                            {getNfsePrestadorNome(nota) !== '—' ? getNfsePrestadorNome(nota) : getNfsePrestadorDocumento(nota)}
                          </div>
                          <div className="truncate text-sm text-slate-600">
                            {getNfseTomadorNome(nota) !== '—' ? getNfseTomadorNome(nota) : getNfseTomadorDocumento(nota)}
                          </div>
                        </div>
                        <StatusBadge status={nota.status} />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-slate-700">
                          {getNfseValor(nota).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <Button asChild variant="ghost" className="h-auto rounded-full px-3 py-1.5 text-slate-700">
                          <Link to="/nfse">
                            Ver lista completa <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border border-slate-900/10 bg-slate-950 text-white shadow-[0_20px_70px_rgba(15,23,42,0.26)]">
              <CardHeader className="pb-4">
                <CardDescription className="text-[11px] uppercase tracking-[0.22em] text-sky-200/85">
                  Direção desta home
                </CardDescription>
                <CardTitle className="text-2xl font-semibold tracking-tight text-white">
                  O dashboard de entrada agora precisa servir operação, não só estética.
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-300" />
                  <p>Consolidar várias prestadoras sem esconder pendências de onboarding.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Receipt className="mt-1 h-4 w-4 text-sky-300" />
                  <p>Mostrar rápido as últimas emissões, com status útil e prestadora visível.</p>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-1 h-4 w-4 text-amber-300" />
                  <p>Preservar o dashboard clássico e o Dash2 sem regressão de rota.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="mt-1 h-4 w-4 text-violet-300" />
                  <p>Preparar terreno para uma próxima camada com filtros e leituras por prestadora.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className={metricCardClass}>
            <CardHeader className="pb-4">
              <CardDescription className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                Pulso das emissões
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950">
                Como a fila recente está se comportando
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Autorizadas</div>
                <div className="mt-3 text-3xl font-semibold text-slate-950">{notasAutorizadas}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">Notas recentes que já fecharam bem.</p>
              </div>
              <div className="rounded-[24px] border border-sky-100 bg-sky-50 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">Processando</div>
                <div className="mt-3 text-3xl font-semibold text-slate-950">{notasProcessando}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">Emissões que ainda estão rodando ou aguardando retorno.</p>
              </div>
              <div className="rounded-[24px] border border-rose-100 bg-rose-50 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-700">Erro ou rejeição</div>
                <div className="mt-3 text-3xl font-semibold text-slate-950">{notasComErro}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">Leituras que merecem ataque mais rápido da operação.</p>
              </div>
            </CardContent>
          </Card>

          <Card className={metricCardClass}>
            <CardHeader className="pb-4">
              <CardDescription className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                Prioridades agora
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950">
                O que vale atacar primeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {prioridades.length === 0 ? (
                <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-900">
                  O quadro geral está saudável. A melhor próxima ação é aprofundar a leitura por prestadora e acompanhar as emissões novas.
                </div>
              ) : (
                prioridades.map((prioridade) => (
                  <Link
                    key={prioridade.title}
                    to={prioridade.href}
                    className={[
                      'rounded-[24px] border p-5 transition hover:shadow-sm',
                      prioridade.tone === 'rose'
                        ? 'border-rose-200 bg-rose-50 text-rose-950 hover:bg-rose-100/80'
                        : prioridade.tone === 'amber'
                          ? 'border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100/80'
                          : 'border-sky-200 bg-sky-50 text-sky-950 hover:bg-sky-100/80',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4" />
                      <div className="space-y-1">
                        <div className="text-sm font-semibold">{prioridade.title}</div>
                        <div className="text-sm leading-6 opacity-85">{prioridade.copy}</div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className={metricCardClass}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-950">Cadastro de prestadoras</CardTitle>
              <CardDescription>O ponto certo para revisar dados, certificado e configuração PlugNotas.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link to="/empresas">Abrir O Prestador</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className={metricCardClass}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-950">Emissão operacional</CardTitle>
              <CardDescription>Entrar direto na DANFSE completa, agora sem pressupor empresa única.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full rounded-full">
                <Link to="/nfse/nova">Abrir Nova DANFSE</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className={metricCardClass}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-950">Visão executiva</CardTitle>
              <CardDescription>Manter o Dash2 vivo para leitura premium e comparativa.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link to="/dash2">Abrir Dash2</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
