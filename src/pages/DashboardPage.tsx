import { useEffect, useMemo, useState } from 'react';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { nfseApi } from '@/services/api';
import KpiCard from '@/components/KpiCard';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { FileText, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Legend,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { getNfseValor } from '@/lib/nfse';
import type { Nfse } from '@/types/api';

const DASHBOARD_VALOR_CACHE_KEY = 'zera_dashboard_valores_v1';
const DASHBOARD_SNAPSHOT_KEY = 'zera_dashboard_snapshot_v1';

type DashboardValorCache = Record<string, { updatedAt: string; valor: number }>;
type DashboardStatusDatum = { name: string; value: number; status?: string };
type DashboardStatsSnapshot = {
  total: number;
  totalAuthorized: number;
  successRate: string;
  pending: number;
  statusData: DashboardStatusDatum[];
  dailyData: Array<{ date: string; total: number; valor: number; dateLabel: string }>;
  savedAt: string;
};

const readValorCache = (): DashboardValorCache => {
  try {
    const raw = localStorage.getItem(DASHBOARD_VALOR_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DashboardValorCache;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeValorCache = (cache: DashboardValorCache) => {
  try {
    localStorage.setItem(DASHBOARD_VALOR_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage errors
  }
};

const readStatsSnapshot = (): DashboardStatsSnapshot | null => {
  try {
    const raw = localStorage.getItem(DASHBOARD_SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DashboardStatsSnapshot;
  } catch {
    return null;
  }
};

const writeStatsSnapshot = (snapshot: DashboardStatsSnapshot) => {
  try {
    localStorage.setItem(DASHBOARD_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore storage errors
  }
};

const STATUS_COLORS: Record<string, string> = {
  AUTHORIZED: 'hsl(142, 72%, 38%)',
  PENDING: 'hsl(38, 92%, 50%)',
  REJECTED: 'hsl(0, 72%, 51%)',
  EJECTE: 'hsl(0, 72%, 51%)',
  ERROR: 'hsl(0, 62%, 45%)',
  ERRORR: 'hsl(0, 62%, 45%)',
  PROCESSING: 'hsl(200, 90%, 48%)',
  CANCELLED: 'hsl(220, 10%, 60%)',
};

const STATUS_LABELS: Record<string, string> = {
  AUTHORIZED: 'Autorizada',
  PENDING: 'Pendente',
  REJECTED: 'Rejeitada',
  EJECTE: 'Rejeitada',
  ERROR: 'Erro',
  ERRORR: 'Erro',
  PROCESSING: 'Processando',
  CANCELLED: 'Cancelada',
};

const getStatusLabel = (status: string) => STATUS_LABELS[status] || status;

const DashboardPage = () => {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<7 | 30>(7);
  const [valorCache, setValorCache] = useState<DashboardValorCache>(() => readValorCache());
  const [cacheEpoch, setCacheEpoch] = useState(0);
  const [statsSnapshot, setStatsSnapshot] = useState<DashboardStatsSnapshot | null>(() => readStatsSnapshot());

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['nfse-dashboard'],
    queryFn: () => nfseApi.list({ page: 1, limit: 1000 }),
    staleTime: 60_000,
  });

  const baseItems = data?.data || [];
  const itemsToEnrich = useMemo(() => {
    return baseItems.filter((item) => {
      if (item.status !== 'AUTHORIZED') return false;
      if (getNfseValor(item) > 0) return false;
      const cached = valorCache[item.id];
      return !(cached && cached.updatedAt === item.updatedAt);
    });
  }, [baseItems, valorCache]);

  const enrichmentQueries = useQueries({
    queries: itemsToEnrich.map((item) => ({
      queryKey: ['nfse-provider-dashboard', item.id, item.updatedAt, cacheEpoch],
      queryFn: async () => {
        const provider = await nfseApi.providerResponse(item.id);
        const root = Array.isArray(provider.raw) ? provider.raw[0] : provider.raw;
        const rootObj = root && typeof root === 'object' ? root as Record<string, unknown> : null;
        const servicoRaw = rootObj?.servico;
        const servico = Array.isArray(servicoRaw) ? servicoRaw[0] : servicoRaw;
        const servicoObj = servico && typeof servico === 'object' ? servico as Record<string, unknown> : null;
        const valorObj = servicoObj?.valor && typeof servicoObj.valor === 'object' ? servicoObj.valor as Record<string, unknown> : null;
        const raw = valorObj?.servico;
        const valor = typeof raw === 'number' ? raw : (typeof raw === 'string' ? Number(raw) : 0);
        return Number.isFinite(valor) ? valor : 0;
      },
      staleTime: 5 * 60 * 1000,
      retry: 0,
      enabled: !!item.id,
    })),
  });

  useEffect(() => {
    if (!itemsToEnrich.length) return;

    let changed = false;
    const nextCache = { ...valorCache };

    itemsToEnrich.forEach((item, index) => {
      const q = enrichmentQueries[index];
      if (!q || !q.isSuccess || typeof q.data !== 'number') return;
      const current = nextCache[item.id];
      if (!current || current.updatedAt !== item.updatedAt || current.valor !== q.data) {
        nextCache[item.id] = { updatedAt: item.updatedAt, valor: q.data };
        changed = true;
      }
    });

    if (changed) {
      setValorCache(nextCache);
      writeValorCache(nextCache);
    }
  }, [itemsToEnrich, enrichmentQueries, valorCache]);

  const items: Nfse[] = useMemo(() => {
    return baseItems.map((item) => {
      const existing = getNfseValor(item);
      const cached = valorCache[item.id];
      return {
        ...item,
        valorServico: existing > 0 ? existing : (cached?.valor ?? item.valorServico),
      };
    });
  }, [baseItems, valorCache]);

  const enrichmentLoading = enrichmentQueries.some((q) => q.isLoading || q.isFetching);

  const stats = useMemo(() => {
    const total = items.length;
    const authorized = items.filter(n => n.status === 'AUTHORIZED');
    const totalAuthorized = authorized.reduce((sum, n) => sum + getNfseValor(n), 0);
    const successRate = total > 0 ? ((authorized.length / total) * 100).toFixed(1) : '0';
    const pending = items.filter(n => n.status === 'PENDING').length;

    const statusCounts: Record<string, number> = {};
    items.forEach(n => {
      statusCounts[n.status] = (statusCounts[n.status] || 0) + 1;
    });
    const statusData: DashboardStatusDatum[] = Object.entries(statusCounts).map(([status, value]) => ({
      status,
      name: getStatusLabel(status),
      value,
    }));

    const dailyMap: Record<string, { date: string; total: number; valor: number }> = {};
    for (let i = 0; i < period; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dailyMap[d] = { date: d, total: 0, valor: 0 };
    }
    items.forEach(n => {
      const d = format(new Date(n.createdAt), 'yyyy-MM-dd');
      if (dailyMap[d]) {
        dailyMap[d].total++;
        dailyMap[d].valor += getNfseValor(n);
      }
    });
    const dailyData = Object.values(dailyMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({ ...d, dateLabel: format(new Date(d.date), 'dd/MM') }));

    return { total, totalAuthorized, successRate, pending, statusData, dailyData };
  }, [items, period]);

  useEffect(() => {
    if (!items.length) return;
    const snapshot: DashboardStatsSnapshot = {
      ...stats,
      savedAt: new Date().toISOString(),
    };
    setStatsSnapshot(snapshot);
    writeStatsSnapshot(snapshot);
  }, [items.length, stats]);

  const handleRecalculate = () => {
    localStorage.removeItem(DASHBOARD_VALOR_CACHE_KEY);
    setValorCache({});
    setCacheEpoch((prev) => prev + 1);
    queryClient.removeQueries({ queryKey: ['nfse-provider-dashboard'] });
    refetch();
  };

  const effectiveStats = items.length ? stats : statsSnapshot;
  const statusChartData = useMemo<DashboardStatusDatum[]>(() => {
    return (effectiveStats?.statusData || []).map((entry) => {
      const rawStatus = entry.status || entry.name;
      return {
        ...entry,
        status: rawStatus,
        name: getStatusLabel(rawStatus),
      };
    });
  }, [effectiveStats?.statusData]);
  if (isLoading && !effectiveStats) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          {isLoading && statsSnapshot && (
            <span className="text-xs text-muted-foreground">
              Exibindo snapshot local enquanto atualiza...
            </span>
          )}
          {enrichmentLoading && <span className="text-xs text-muted-foreground">Atualizando valores financeiros...</span>}
          <Button variant="outline" size="sm" onClick={handleRecalculate}>Recalcular do zero</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total de Emissões" value={effectiveStats?.total || 0} icon={FileText} />
        <KpiCard
          title="Total Autorizado"
          value={`R$ ${(effectiveStats?.totalAuthorized || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
        />
        <KpiCard title="Taxa de Sucesso" value={`${effectiveStats?.successRate || '0'}%`} icon={CheckCircle} />
        <KpiCard title="Pendências" value={effectiveStats?.pending || 0} icon={Clock} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Emissões por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {statusChartData.map((entry) => (
                      <Cell key={entry.status || entry.name} fill={STATUS_COLORS[entry.status || ''] || '#ccc'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [value, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Emissões por Dia</CardTitle>
            <div className="flex gap-1">
              <Button variant={period === 7 ? 'default' : 'ghost'} size="sm" onClick={() => setPeriod(7)}>7d</Button>
              <Button variant={period === 30 ? 'default' : 'ghost'} size="sm" onClick={() => setPeriod(30)}>30d</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={effectiveStats?.dailyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dateLabel" fontSize={11} tickLine={false} />
                <YAxis fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Emissões" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Valor Emitido (R$)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={effectiveStats?.dailyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dateLabel" fontSize={11} tickLine={false} />
                <YAxis fontSize={11} tickLine={false} />
                <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']} />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="hsl(var(--success))"
                  fill="hsl(var(--success) / 0.15)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
