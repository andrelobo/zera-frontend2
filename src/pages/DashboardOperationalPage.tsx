import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  FileWarning,
  LayoutDashboard,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import ErrorState from '@/components/ErrorState';
import LoadingState from '@/components/LoadingState';
import StatusBadge from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import {
  buildOperationalPriorities,
  getEmissionHealth,
  selectCompaniesRequiringAction,
  type CompanyReadinessTone,
} from '@/lib/dashboard-operational';
import {
  getNfsePrestadorDocumento,
  getNfsePrestadorNome,
  getNfseTomadorDocumento,
  getNfseTomadorNome,
  getNfseValor,
} from '@/lib/nfse';
import { isReadOnlyRole } from '@/lib/roles';
import { empresasApi, nfseApi } from '@/services/api';
import type { Empresa } from '@/types/api';

type Readiness = {
  tone: CompanyReadinessTone;
  label: string;
  summary: string;
  missing: string[];
};

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const dateTime = (value?: string | null) => {
  if (!value) return 'Data indisponível';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(date);
};

const getReadiness = (empresa: Empresa): Readiness => {
  const checks = [
    {
      ok: Boolean(
        empresa.providerCertificadoId || empresa.certificado?.nomeArquivo ||
        empresa.certificado?.fileName || empresa.certificado?.arquivo,
      ),
      label: 'Certificado digital',
    },
    { ok: Boolean(empresa.inscricaoMunicipal), label: 'Inscrição municipal' },
    {
      ok: Boolean(
        empresa.endereco?.codigoMunicipio || empresa.providerData?.endereco?.municipio?.codigo_ibge ||
        empresa.providerData?.endereco?.codigoCidade,
      ),
      label: 'Município operacional',
    },
    {
      ok: Boolean(
        empresa.plugNotasNfse?.ativoNfseNacional || empresa.configOperacionais?.length ||
        empresa.serieDpsNum || empresa.dpsNum,
      ),
      label: 'Configuração fiscal',
    },
  ];
  const completed = checks.filter((check) => check.ok).length;
  const missing = checks.filter((check) => !check.ok).map((check) => check.label);
  if (completed === 4) return { tone: 'ready', label: 'Pronta', summary: '4 de 4 requisitos', missing: [] };
  if (completed >= 2) return { tone: 'attention', label: 'Revisar', summary: `${completed} de 4 requisitos`, missing };
  return { tone: 'onboarding', label: 'Onboarding', summary: `${completed} de 4 requisitos`, missing };
};

const metricStyles = {
  neutral: 'border-border bg-card',
  success: 'border-success/20 bg-success/[0.06]',
  info: 'border-info/20 bg-info/[0.06]',
  critical: 'border-destructive/20 bg-destructive/[0.06]',
};

const priorityStyles = {
  critical: 'border-destructive/25 bg-destructive/[0.06] text-destructive',
  warning: 'border-warning/25 bg-warning/[0.07] text-warning',
  neutral: 'border-info/20 bg-info/[0.06] text-info',
  success: 'border-success/20 bg-success/[0.06] text-success',
};

const readinessStyles = {
  attention: 'border-warning/20 bg-warning/[0.07] text-warning',
  onboarding: 'border-destructive/20 bg-destructive/[0.06] text-destructive',
  ready: 'border-success/20 bg-success/[0.06] text-success',
};

const DashboardOperationalPage = () => {
  const { user } = useAuth();
  const isReadOnly = isReadOnlyRole(user?.role || 'user');
  const empresasQuery = useQuery({
    queryKey: ['empresas', 'dashboard-header'],
    queryFn: () => empresasApi.list({ limit: 24 }),
    staleTime: 60_000,
  });
  const nfseQuery = useQuery({
    queryKey: ['nfse-dashboard-list-v3', 'home-entry'],
    queryFn: () => nfseApi.list({ page: 1, limit: 10, sort: 'createdAt', order: 'DESC' }),
    staleTime: 60_000,
  });

  const empresas = (empresasQuery.data || []).filter(Boolean);
  const notas = useMemo(() => nfseQuery.data?.data || [], [nfseQuery.data?.data]);
  const prestadoras = useMemo(() => empresas.map((empresa) => ({
    id: empresa.id || empresa._id || empresa.cnpj || empresa.razaoSocial,
    name: empresa.razaoSocial || 'Prestadora sem razão social',
    cnpj: empresa.cnpj || '',
    readiness: getReadiness(empresa),
  })), [empresas]);
  const health = useMemo(() => getEmissionHealth(notas), [notas]);
  const ready = prestadoras.filter((item) => item.readiness.tone === 'ready').length;
  const attention = prestadoras.filter((item) => item.readiness.tone === 'attention').length;
  const onboarding = prestadoras.filter((item) => item.readiness.tone === 'onboarding').length;
  const companiesRequiringAction = selectCompaniesRequiringAction(prestadoras);
  const priorities = buildOperationalPriorities({
    failedEmissions: health.failed,
    onboardingCompanies: onboarding,
    attentionCompanies: attention,
    isReadOnly,
  });
  const volume = notas.reduce((sum, nota) => sum + getNfseValor(nota), 0);
  const refreshing = empresasQuery.isFetching || nfseQuery.isFetching;

  if (empresasQuery.isLoading) return <LoadingState />;
  if (empresasQuery.isError && prestadoras.length === 0) {
    return <ErrorState onRetry={() => empresasQuery.refetch()} />;
  }

  const refresh = () => {
    void empresasQuery.refetch();
    void nfseQuery.refetch();
  };

  const metrics = [
    { label: 'Prestadoras', value: prestadoras.length, detail: `${ready} prontas para operar`, icon: Building2, tone: 'neutral' as const },
    { label: 'Autorizadas', value: health.authorized, detail: `${health.authorizationRate}% da fila recente`, icon: CheckCircle2, tone: 'success' as const },
    { label: 'Processando', value: health.processing, detail: 'Aguardando conclusão', icon: Clock3, tone: 'info' as const },
    { label: 'Falhas fiscais', value: health.failed, detail: health.failed ? 'Exigem atenção agora' : 'Nenhuma falha recente', icon: FileWarning, tone: 'critical' as const },
  ];

  return (
    <main className="min-h-full bg-background">
      <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <header className="relative overflow-hidden rounded-2xl border border-night-800 bg-night-950 px-5 py-6 text-ivory-100 shadow-lg sm:px-7 lg:px-8">
          <div aria-hidden="true" className="absolute inset-y-0 right-0 w-2/5 bg-[radial-gradient(circle_at_center,_rgba(108,166,93,0.2),_transparent_68%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-white/10 bg-white/10 text-silver-300 hover:bg-white/10">
                  <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" /> Visão operacional
                </Badge>
                <span className="text-xs text-silver-300">Últimas 10 emissões</span>
              </div>
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  Sua operação, em foco.
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-silver-300 sm:text-base">
                  Acompanhe a fila fiscal, resolva pendências e mantenha as prestadoras prontas para operar.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={refresh} disabled={refreshing}
                className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Atualizar
              </Button>
              <Button asChild className="bg-ivory-100 text-night-950 hover:bg-white">
                <Link to={isReadOnly ? '/nfse' : '/nfse/nova'}>
                  {isReadOnly ? 'Consultar notas' : 'Nova DANFSE'} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <section aria-label="Indicadores principais" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className={`rounded-2xl shadow-sm ${metricStyles[metric.tone]}`}>
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{metric.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 p-2.5">
                  <metric.icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardDescription>Saúde da fila fiscal</CardDescription>
                    <CardTitle className="mt-1 text-xl">Conclusão das emissões recentes</CardTitle>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-semibold">{health.authorizationRate}%</div>
                    <div className="text-xs text-muted-foreground">autorizadas</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img"
                  aria-label={`${health.authorized} autorizadas, ${health.processing} processando, ${health.failed} com falha`}>
                  {health.total > 0 && <>
                    <span className="bg-success" style={{ width: `${(health.authorized / health.total) * 100}%` }} />
                    <span className="bg-info" style={{ width: `${(health.processing / health.total) * 100}%` }} />
                    <span className="bg-destructive" style={{ width: `${(health.failed / health.total) * 100}%` }} />
                    <span className="bg-muted-foreground/40" style={{ width: `${(health.other / health.total) * 100}%` }} />
                  </>}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  {[
                    ['Autorizadas', health.authorized, 'bg-success'], ['Processando', health.processing, 'bg-info'],
                    ['Falhas', health.failed, 'bg-destructive'], ['Outros', health.other, 'bg-muted-foreground/50'],
                  ].map(([label, value, color]) => (
                    <div key={String(label)} className="rounded-xl border bg-muted/30 p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={`h-2 w-2 rounded-full ${color}`} /> {label}
                      </div>
                      <div className="mt-1 text-lg font-semibold">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t pt-4">
                  <div><p className="text-xs text-muted-foreground">Volume da amostra</p><p className="mt-1 font-semibold">{money(volume)}</p></div>
                  <Button asChild variant="ghost" size="sm"><Link to="/nfse">Ver operação <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-3"><CardDescription>Prioridades</CardDescription><CardTitle className="text-xl">Próximas ações</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {priorities.map((priority) => (
                  <Link key={priority.kind} to={priority.href} className="group flex items-center gap-3 rounded-xl border p-3.5 hover:bg-muted/50">
                    <div className={`rounded-lg border p-2 ${priorityStyles[priority.tone]}`}>
                      {priority.kind === 'healthy' ? <ShieldCheck className="h-4 w-4" /> : priority.kind === 'emission-failure' ? <AlertCircle className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{priority.title}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{priority.description}</p></div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <div><CardDescription>Atividade recente</CardDescription><CardTitle className="mt-1 text-xl">Últimas emissões</CardTitle></div>
              <Button asChild variant="outline" size="sm"><Link to="/nfse">Ver todas</Link></Button>
            </CardHeader>
            <CardContent className="p-0">
              {nfseQuery.isLoading ? <div className="p-6 text-sm text-muted-foreground">Carregando emissões...</div> : notas.length === 0 ? (
                <div className="m-5 rounded-xl border border-dashed p-8 text-center"><ReceiptText className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Nenhuma emissão recente</p></div>
              ) : <div className="divide-y">
                {notas.slice(0, 7).map((nota) => {
                  const prestador = getNfsePrestadorNome(nota) !== '—' ? getNfsePrestadorNome(nota) : getNfsePrestadorDocumento(nota);
                  const tomador = getNfseTomadorNome(nota) !== '—' ? getNfseTomadorNome(nota) : getNfseTomadorDocumento(nota);
                  return <Link key={nota.id} to={`/nfse/${nota.id}`} className="grid gap-3 px-5 py-4 hover:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold">{prestador}</p><span className="hidden text-muted-foreground sm:inline">→</span><p className="hidden truncate text-sm text-muted-foreground sm:block">{tomador}</p></div>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground"><span className="truncate sm:hidden">{tomador}</span><span>{dateTime(nota.createdAt || nota.dataEmissao)}</span><span className="font-medium text-foreground">{money(getNfseValor(nota))}</span></div>
                    </div><StatusBadge status={nota.status} />
                  </Link>;
                })}
              </div>}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3"><div><CardDescription>Prontidão</CardDescription><CardTitle className="mt-1 text-xl">Prestadoras que exigem ação</CardTitle></div><Button asChild variant="outline" size="sm"><Link to="/empresas">Gerenciar</Link></Button></CardHeader>
            <CardContent>
              {companiesRequiringAction.length === 0 ? <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/[0.06] p-4"><CheckCircle2 className="h-5 w-5 text-success" /><div><p className="text-sm font-semibold">Todas as prestadoras estão prontas</p><p className="mt-0.5 text-xs text-muted-foreground">Nenhuma pendência cadastral prioritária.</p></div></div> :
                <div className="grid gap-3 md:grid-cols-2">{companiesRequiringAction.map((company) => <Link key={company.id} to="/empresas" className="rounded-xl border p-4 hover:bg-muted/40"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{company.name}</p><p className="mt-1 text-xs text-muted-foreground">{company.cnpj || 'CNPJ pendente'}</p></div><Badge variant="outline" className={readinessStyles[company.readiness.tone]}>{company.readiness.label}</Badge></div><p className="mt-3 text-xs font-medium text-muted-foreground">{company.readiness.summary}</p><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">Pendente: {company.readiness.missing.join(', ')}</p></Link>)}</div>}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-night-800 bg-night-950 text-white shadow-sm">
            <CardHeader className="pb-3"><CardDescription className="text-silver-300">Acesso rápido</CardDescription><CardTitle className="text-xl text-white">Outras leituras</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Link to="/dash2" className="flex items-center gap-3 rounded-xl border border-white/10 p-3.5 hover:bg-white/[0.06]"><Sparkles className="h-4 w-4 text-leaf-500" /><div className="flex-1"><p className="text-sm font-medium">Visão executiva</p><p className="mt-0.5 text-xs text-silver-300">Indicadores financeiros e tributários</p></div><ArrowRight className="h-4 w-4 text-silver-300" /></Link>
              <Link to="/dashboard-classico" className="flex items-center gap-3 rounded-xl border border-white/10 p-3.5 hover:bg-white/[0.06]"><LayoutDashboard className="h-4 w-4 text-sage-400" /><div className="flex-1"><p className="text-sm font-medium">Dashboard clássico</p><p className="mt-0.5 text-xs text-silver-300">Leitura detalhada preservada</p></div><ArrowRight className="h-4 w-4 text-silver-300" /></Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
};

export default DashboardOperationalPage;
