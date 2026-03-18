import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowUpRight, Building2, CircleDollarSign, Landmark, Receipt, ShieldAlert, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { empresasApi, nfseApi } from '@/services/api';
import { useDashboardData } from '@/hooks/useDashboardData';
import { formatCurrency, formatPercent } from '@/utils/simples-nacional';

const DASHBOARD_MIN_EMISSAO_DATE = new Date(2026, 1, 11, 0, 0, 0, 0);

const trendTone = (value: number) => {
  if (value >= 30) return 'text-emerald-300';
  if (value >= 20) return 'text-sky-300';
  if (value >= 10) return 'text-amber-300';
  return 'text-rose-300';
};

const surfaceClass =
  'rounded-[28px] border border-white/10 bg-white/75 shadow-[0_20px_60px_rgba(15,23,42,0.14)] backdrop-blur';

const Dash2Page = () => {
  const empresasQuery = useQuery({
    queryKey: ['empresas', 'dashboard-header'],
    queryFn: () => empresasApi.list({ limit: 1 }),
    staleTime: 60_000,
  });

  const nfseQuery = useQuery({
    queryKey: ['nfse', 'dashboard-rbt12'],
    queryFn: () => {
      const now = new Date();
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      const cutoffDate = oneYearAgo > DASHBOARD_MIN_EMISSAO_DATE ? oneYearAgo : DASHBOARD_MIN_EMISSAO_DATE;

      return nfseApi.biSummary({
        dateFrom: cutoffDate.toISOString().slice(0, 10),
        dateTo: now.toISOString().slice(0, 10),
      });
    },
    staleTime: 60_000,
  });

  const empresa = (empresasQuery.data || [])[0];

  const rbt12 = useMemo(() => {
    return nfseQuery.data?.totals?.somaValorServico || 0;
  }, [nfseQuery.data]);

  const safeRbt12 = rbt12 > 0 ? rbt12 : 180000;

  const {
    loading,
    notas,
    kpis,
    calculo,
    dadosMensais,
    analiseClientes,
    alertas,
    fluxoCaixa,
  } = useDashboardData(empresa?.id || null, safeRbt12, 'III');

  const mesAnterior = dadosMensais[dadosMensais.length - 2];
  const variacaoMensal = mesAnterior?.faturamento
    ? ((kpis.faturamentoMes - mesAnterior.faturamento) / mesAnterior.faturamento) * 100
    : 0;

  const topClientes = useMemo(() => analiseClientes.slice(0, 5), [analiseClientes]);
  const ultimasNotas = useMemo(
    () =>
      [...notas]
        .sort((a, b) => new Date(b.data_emissao).getTime() - new Date(a.data_emissao).getTime())
        .slice(0, 5),
    [notas],
  );

  const maiorCliente = topClientes[0];
  const alertasCriticos = useMemo(
    () => alertas.filter((item) => item.tipo === 'danger'),
    [alertas],
  );

  if ((empresasQuery.isLoading && nfseQuery.isLoading) || loading) return <LoadingState />;
  if (empresasQuery.isError && !empresa) return <ErrorState onRetry={() => empresasQuery.refetch()} />;

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_28%),radial-gradient(circle_at_85%_18%,_rgba(249,115,22,0.15),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_45%,_#f8fafc_100%)] px-1 py-1">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,_#0f172a_0%,_#132b57_55%,_#1447a6_100%)] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.28)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <Badge variant="outline" className="border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/80">
                Dash2 Fiscal Premium
              </Badge>
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.28em] text-sky-200/80">Resumo Executivo</p>
                <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                  {empresa?.razaoSocial || 'Dashboard Financeiro'}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                  Leitura visual mais limpa para faturamento, DAS, concentracao de clientes e pulso operacional do fiscal,
                  sem alterar nenhuma regra do motor atual.
                </p>
              </div>
            </div>

            <div className="grid min-w-[290px] gap-3 sm:grid-cols-2">
              <HeroMetric
                label="RBT12"
                value={formatCurrency(safeRbt12)}
                supporting={`Anexo ${'III'} • ${kpis.competenciaLabel}`}
                icon={<Landmark className="h-5 w-5" />}
              />
              <HeroMetric
                label="DAS estimado"
                value={formatCurrency(kpis.dasEstimado)}
                supporting={`Aliquota efetiva ${formatPercent(calculo.aliquotaEfetiva)}`}
                icon={<CircleDollarSign className="h-5 w-5" />}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Faturamento do mes"
            value={formatCurrency(kpis.faturamentoMes)}
            hint={kpis.competenciaLabel}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatCard
            label="A recolher"
            value={formatCurrency(kpis.dasAPagar)}
            hint={`ISS retido ${formatCurrency(kpis.issRetidoMes)}`}
            icon={<Receipt className="h-5 w-5" />}
          />
          <StatCard
            label="Margem liquida"
            value={formatPercent(kpis.margemLiquida / 100)}
            hint={variacaoMensal ? `${variacaoMensal >= 0 ? '+' : ''}${variacaoMensal.toFixed(1)}% vs mes anterior` : 'Sem base comparativa'}
            icon={<ArrowUpRight className={`h-5 w-5 ${trendTone(kpis.margemLiquida)}`} />}
          />
          <StatCard
            label="Notas emitidas"
            value={String(kpis.totalNotas)}
            hint={`${kpis.totalNotasMes} na competencia atual`}
            icon={<Building2 className="h-5 w-5" />}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className={`${surfaceClass} border-slate-200/70`}>
            <CardHeader className="pb-4">
              <CardDescription className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Radar Fiscal</CardDescription>
              <CardTitle className="text-xl font-black text-slate-900">Pulso da operacao tributaria</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InsightBlock
                title="Receita liquida projetada"
                value={formatCurrency(kpis.valorLiquidoMes)}
                copy="Quanto sobra no recorte atual apos DAS e retencoes federais."
              />
              <InsightBlock
                title="Saldo operacional"
                value={formatCurrency(fluxoCaixa.saldo)}
                copy="Leitura combinada de liquidez operacional e peso tributario."
              />
              <InsightBlock
                title="Aliquota ISS de referencia"
                value={calculo.valido ? formatPercent(calculo.issReferencia) : '—'}
                copy="Referencia da partilha do Simples para a faixa atual."
              />
              <InsightBlock
                title="Retencoes federais"
                value={formatCurrency(kpis.totalRetencoes)}
                copy="Soma das retencoes mapeadas no periodo lido pelo dashboard."
              />
            </CardContent>
          </Card>

          <Card className={`${surfaceClass} border-slate-200/70`}>
            <CardHeader className="pb-4">
              <CardDescription className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Alertas</CardDescription>
              <CardTitle className="text-xl font-black text-slate-900">O que pede atencao agora</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alertas.length === 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  Nenhum alerta relevante identificado no motor atual.
                </div>
              )}
              {alertas.map((alerta, index) => (
                <div
                  key={`${alerta.tipo}-${index}`}
                  className={`rounded-2xl border p-4 text-sm leading-6 ${
                    alerta.tipo === 'danger'
                      ? 'border-rose-200 bg-rose-50 text-rose-900'
                      : 'border-amber-200 bg-amber-50 text-amber-900'
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    {alerta.tipo === 'danger' ? <ShieldAlert className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    {alerta.tipo === 'danger' ? 'Critico' : 'Atencao'}
                  </div>
                  <p>{alerta.mensagem}</p>
                </div>
              ))}
              {alertasCriticos.length === 0 && maiorCliente && (
                <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                  <p className="mb-1 font-semibold">Concentracao mais alta</p>
                  <p>
                    {maiorCliente.nome} responde por {maiorCliente.percentual.toFixed(1)}% da receita observada.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className={`${surfaceClass} border-slate-200/70`}>
            <CardHeader className="pb-4">
              <CardDescription className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Clientes</CardDescription>
              <CardTitle className="text-xl font-black text-slate-900">Concentracao de receita</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topClientes.length === 0 && <EmptyCopy copy="Ainda nao ha dados suficientes para listar tomadores relevantes." />}
              {topClientes.map((cliente) => (
                <div key={cliente.tomadorId} className="space-y-2">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{cliente.nome}</p>
                      <p className="text-xs text-slate-500">
                        {cliente.quantidadeNf} NF • ticket medio {formatCurrency(cliente.ticketMedio)}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                      Classe {cliente.classificacao}
                    </Badge>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#0f766e_0%,#06b6d4_100%)]"
                      style={{ width: `${Math.min(cliente.percentual, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{cliente.percentual.toFixed(1)}% da receita</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(cliente.faturamento)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className={`${surfaceClass} border-slate-200/70`}>
            <CardHeader className="pb-4">
              <CardDescription className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Linha do tempo</CardDescription>
              <CardTitle className="text-xl font-black text-slate-900">Ultimas emissões lidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ultimasNotas.length === 0 && <EmptyCopy copy="Nenhuma emissao encontrada para compor a timeline operacional." />}
              {ultimasNotas.map((nota) => (
                <div key={nota.id} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                  <div className="mt-0.5 rounded-full bg-slate-900 p-2 text-white">
                    <Receipt className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{nota.tomador_nome || 'Emissao expressa'}</p>
                      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                        {nota.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{new Date(nota.data_emissao).toLocaleString('pt-BR')}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="text-slate-500">Valor</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(nota.valor_servico)}</span>
                      <span className="text-slate-500">Liquido</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(nota.valor_liquido)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className={`${surfaceClass} border-slate-200/70`}>
            <CardHeader className="pb-4">
              <CardDescription className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Competencia</CardDescription>
              <CardTitle className="text-xl font-black text-slate-900">Resumo do periodo atual</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <MiniPanel label="Empresa" value={empresa?.razaoSocial || 'Nao identificada'} icon={<Building2 className="h-4 w-4" />} />
              <MiniPanel label="Regime" value={typeof empresa?.regimeTributario === 'string' ? empresa.regimeTributario : 'Nao informado'} icon={<Landmark className="h-4 w-4" />} />
              <MiniPanel label="Anexo" value={`Anexo III`} icon={<ShieldAlert className="h-4 w-4" />} />
              <MiniPanel label="Top tomadores" value={String(topClientes.length)} icon={<Users className="h-4 w-4" />} />
            </CardContent>
          </Card>

          <Card className={`${surfaceClass} border-slate-200/70`}>
            <CardHeader className="pb-4">
              <CardDescription className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Direcao visual</CardDescription>
              <CardTitle className="text-xl font-black text-slate-900">O que muda no Dash2</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
              <p>Menos widgets, mais hierarquia. O numero principal aparece primeiro, os alertas sobem e as listas viram apoio.</p>
              <p>As mesmas regras do dashboard atual continuam ativas. O que mudou foi a leitura: respiro, contraste e prioridade.</p>
              <p>Este Dash2 existe em paralelo para validar a nova direcao sem risco de regressao no painel antigo.</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

const HeroMetric = ({
  label,
  value,
  supporting,
  icon,
}: {
  label: string;
  value: string;
  supporting: string;
  icon: React.ReactNode;
}) => (
  <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
    <div className="mb-3 flex items-center justify-between text-white/70">
      <span className="text-[11px] uppercase tracking-[0.22em]">{label}</span>
      {icon}
    </div>
    <p className="text-2xl font-black tracking-tight text-white">{value}</p>
    <p className="mt-2 text-xs text-white/70">{supporting}</p>
  </div>
);

const StatCard = ({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) => (
  <Card className={`${surfaceClass} border-slate-200/70`}>
    <CardContent className="flex items-start justify-between gap-4 p-5">
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{label}</p>
        <p className="text-2xl font-black tracking-tight text-slate-950">{value}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
      <div className="rounded-2xl bg-slate-950 p-3 text-white shadow-lg">
        {icon}
      </div>
    </CardContent>
  </Card>
);

const InsightBlock = ({
  title,
  value,
  copy,
}: {
  title: string;
  value: string;
  copy: string;
}) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4">
    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{title}</p>
    <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">{value}</p>
    <p className="mt-2 text-xs leading-5 text-slate-500">{copy}</p>
  </div>
);

const MiniPanel = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4">
    <div className="mb-3 flex items-center gap-2 text-slate-500">
      {icon}
      <span className="text-[11px] uppercase tracking-[0.18em]">{label}</span>
    </div>
    <p className="text-sm font-semibold text-slate-900">{value}</p>
  </div>
);

const EmptyCopy = ({ copy }: { copy: string }) => (
  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
    {copy}
  </div>
);

export default Dash2Page;
