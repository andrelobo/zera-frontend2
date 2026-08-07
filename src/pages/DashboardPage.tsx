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
import type { Empresa } from '@/types/api';
import {
  getNfsePrestadorDocumento,
  getNfsePrestadorNome,
  getNfseTomadorDocumento,
  getNfseTomadorNome,
  getNfseValor,
} from '@/lib/nfse';
import { AlertTriangle, ArrowRight, Building2, CheckCircle2, Receipt, Rocket, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isReadOnlyRole } from '@/lib/roles';

const metricCardClass =
  'rounded-[18px] border border-border bg-card shadow-md';

const formatCnpj = (value?: string | null) => {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.length !== 14) return value || 'CNPJ pendente';
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

const getPrestadoraReadiness = (empresa: Empresa) => {
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
  const { user } = useAuth();
  const isReadOnly = isReadOnlyRole(user?.role || 'user');
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

  const empresas = (empresasQuery.data || []).filter(Boolean);
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
          href: isReadOnly ? '/nfse' : '/nfse/nova',
          tone: 'sky',
        }
      : null,
  ].filter(Boolean) as Array<{ title: string; copy: string; href: string; tone: 'rose' | 'amber' | 'sky' }>

  if (empresasQuery.isLoading) return <LoadingState />;
  if (empresasQuery.isError && prestadoras.length === 0) {
    return <ErrorState onRetry={() => empresasQuery.refetch()} />;
  }

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(108,166,93,0.16),_transparent_28%),linear-gradient(180deg,_#F7F5F0_0%,_#EBE6DE_58%,_#F7F5F0_100%)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[18px] border border-white/10 bg-[linear-gradient(135deg,_#071020_0%,_#0A1728_58%,_#122238_100%)] px-6 py-8 text-ivory-100 shadow-lg sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              <Badge variant="outline" className="border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.26em] text-white/85">
                Home operacional
              </Badge>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
                  Bem-vindo à Jupati.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-silver-300 sm:text-base">
                  Esta entrada nova troca o painel apertado por uma visão consolidada do que importa agora: prestadoras prontas, pendências de onboarding e o pulso das últimas emissões.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {!isReadOnly ? (
                  <>
                    <Button asChild className="rounded-full bg-warm-50 px-5 text-night-950 hover:bg-ivory-100">
                      <Link to="/nfse/nova">
                        Nova DANFSE <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full border-white/20 bg-white/10 px-5 text-white hover:bg-white/15 hover:text-white">
                      <Link to="/nfse/rapida">
                        Emissão rápida <Rocket className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button asChild className="rounded-full bg-warm-50 px-5 text-night-950 hover:bg-ivory-100">
                    <Link to="/nfse">
                      Ver notas fiscais <Receipt className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" className="rounded-full border-white/20 bg-transparent px-5 text-white hover:bg-white/10 hover:text-white">
                  <Link to="/dashboard-classico">
                    Dashboard clássico
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[18px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-silver-300">Prestadoras</div>
                <div className="mt-3 text-4xl font-semibold text-white">{totalPrestadoras}</div>
                <p className="mt-2 text-sm leading-6 text-silver-300">
                  Empresas conectadas à base operacional Jupati.
                </p>
              </div>
              <div className="rounded-[18px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-leaf-500">Prontas</div>
                <div className="mt-3 text-4xl font-semibold text-white">{prontas}</div>
                <p className="mt-2 text-sm leading-6 text-silver-300">
                  Melhor sinal de prontidão para emissão.
                </p>
              </div>
              <div className="rounded-[18px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-warning">Em revisão</div>
                <div className="mt-3 text-4xl font-semibold text-white">{emAtencao}</div>
                <p className="mt-2 text-sm leading-6 text-silver-300">
                  Pedem ajuste antes de ganhar confiança operacional.
                </p>
              </div>
              <div className="rounded-[18px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-100/85">Com emissão recente</div>
                <div className="mt-3 text-4xl font-semibold text-white">{prestadorasComEmissaoRecente}</div>
                <p className="mt-2 text-sm leading-6 text-silver-300">
                  Prestadoras vistas nas últimas notas monitoradas. {onboarding} ainda estão em onboarding.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className={metricCardClass}>
            <CardHeader className="pb-4">
              <CardDescription className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Panorama de prestadoras
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
                Quem já está pronta e quem ainda pede cuidado
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {prestadoras.length === 0 ? (
                <div className="rounded-[14px] border border-dashed border-border bg-muted/40 p-6 text-sm leading-6 text-muted-foreground">
                  Ainda não há prestadoras suficientes para compor esta leitura consolidada.
                </div>
              ) : (
                prestadoras.map((prestadora) => (
                  <div key={prestadora.id} className="rounded-[14px] border border-border bg-muted/50 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-foreground">{prestadora.razaoSocial}</h3>
                          <span
                            className={[
                              'rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
                              prestadora.readiness.tone === 'ready'
                                ? 'bg-success/10 text-success'
                                : prestadora.readiness.tone === 'attention'
                                  ? 'bg-warning/10 text-warning-foreground'
                                  : 'bg-destructive/10 text-destructive',
                            ].join(' ')}
                          >
                            {prestadora.readiness.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
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
                          className="rounded-[14px] border border-white bg-white px-4 py-3 text-sm font-medium text-foreground/80 shadow-sm"
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
                <CardDescription className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Últimas emissões
                </CardDescription>
                <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
                  Leitura rápida do que acabou de acontecer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {nfseQuery.isLoading ? (
                  <div className="rounded-[14px] border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                    Carregando últimas emissões...
                  </div>
                ) : notas.length === 0 ? (
                  <div className="rounded-[14px] border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                    Ainda não há emissões recentes para esta visão.
                  </div>
                ) : (
                  notas.map((nota) => (
                    <div key={nota.id} className="rounded-[14px] border border-border bg-muted/50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="truncate text-sm font-semibold text-foreground">
                            {getNfsePrestadorNome(nota) !== '—' ? getNfsePrestadorNome(nota) : getNfsePrestadorDocumento(nota)}
                          </div>
                          <div className="truncate text-sm text-muted-foreground">
                            {getNfseTomadorNome(nota) !== '—' ? getNfseTomadorNome(nota) : getNfseTomadorDocumento(nota)}
                          </div>
                        </div>
                        <StatusBadge status={nota.status} />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-foreground/80">
                          {getNfseValor(nota).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <Button asChild variant="ghost" className="h-auto rounded-full px-3 py-1.5 text-foreground/80">
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

            <Card className="rounded-[18px] border border-white/10 bg-night-950 text-white shadow-[0_20px_70px_rgba(15,23,42,0.26)]">
              <CardHeader className="pb-4">
                <CardDescription className="text-[11px] uppercase tracking-[0.22em] text-silver-300">
                  Direção desta home
                </CardDescription>
                <CardTitle className="text-2xl font-semibold tracking-tight text-white">
                  O dashboard de entrada agora precisa servir operação, não só estética.
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-silver-300">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 text-success" />
                  <p>Consolidar várias prestadoras sem esconder pendências de onboarding.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Receipt className="mt-1 h-4 w-4 text-sage-400" />
                  <p>Mostrar rápido as últimas emissões, com status útil e prestadora visível.</p>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-1 h-4 w-4 text-warning" />
                  <p>Preservar o dashboard clássico e o Dash2 sem regressão de rota.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="mt-1 h-4 w-4 text-silver-300" />
                  <p>Preparar terreno para uma próxima camada com filtros e leituras por prestadora.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className={metricCardClass}>
            <CardHeader className="pb-4">
              <CardDescription className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Pulso das emissões
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
                Como a fila recente está se comportando
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[14px] border border-success/25 bg-success/10 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-success">Autorizadas</div>
                <div className="mt-3 text-3xl font-semibold text-foreground">{notasAutorizadas}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Notas recentes que já fecharam bem.</p>
              </div>
              <div className="rounded-[14px] border border-info/25 bg-info/10 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-info">Processando</div>
                <div className="mt-3 text-3xl font-semibold text-foreground">{notasProcessando}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Emissões que ainda estão rodando ou aguardando retorno.</p>
              </div>
              <div className="rounded-[14px] border border-destructive/25 bg-destructive/10 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-destructive">Erro ou rejeição</div>
                <div className="mt-3 text-3xl font-semibold text-foreground">{notasComErro}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Leituras que merecem ataque mais rápido da operação.</p>
              </div>
            </CardContent>
          </Card>

          <Card className={metricCardClass}>
            <CardHeader className="pb-4">
              <CardDescription className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Prioridades agora
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
                O que vale atacar primeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {prioridades.length === 0 ? (
                <div className="rounded-[14px] border border-success/25 bg-success/10 p-5 text-sm leading-6 text-foreground">
                  O quadro geral está saudável. A melhor próxima ação é aprofundar a leitura por prestadora e acompanhar as emissões novas.
                </div>
              ) : (
                prioridades.map((prioridade) => (
                  <Link
                    key={prioridade.title}
                    to={prioridade.href}
                    className={[
                      'rounded-[14px] border p-5 transition hover:shadow-sm',
                      prioridade.tone === 'rose'
                        ? 'border-destructive/25 bg-destructive/10 text-foreground hover:bg-destructive/15'
                        : prioridade.tone === 'amber'
                          ? 'border-warning/25 bg-warning/10 text-foreground hover:bg-warning/15'
                          : 'border-info/25 bg-info/10 text-foreground hover:bg-info/15',
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
              <CardTitle className="text-lg font-semibold text-foreground">Cadastro de prestadoras</CardTitle>
              <CardDescription>Revise dados, certificado e prontidão para a operação fiscal.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link to="/empresas">Abrir Empresas</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className={metricCardClass}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-foreground">Emissão operacional</CardTitle>
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
              <CardTitle className="text-lg font-semibold text-foreground">Visão executiva</CardTitle>
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
