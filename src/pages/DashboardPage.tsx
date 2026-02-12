import { useQuery } from '@tanstack/react-query';
import { nfseApi } from '@/services/api';
import KpiCard from '@/components/KpiCard';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import StatusBadge from '@/components/StatusBadge';
import { FileText, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Legend,
} from 'recharts';
import { format, subDays } from 'date-fns';
import type { Nfse, NfseStatus } from '@/types/api';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

const STATUS_COLORS: Record<string, string> = {
  AUTHORIZED: 'hsl(142, 72%, 38%)',
  PENDING: 'hsl(38, 92%, 50%)',
  REJECTED: 'hsl(0, 72%, 51%)',
  ERROR: 'hsl(0, 62%, 45%)',
  PROCESSING: 'hsl(200, 90%, 48%)',
  CANCELLED: 'hsl(220, 10%, 60%)',
};

const DashboardPage = () => {
  const [period, setPeriod] = useState<7 | 30>(7);

  // Fetch all NFSe for dashboard calculations
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['nfse-dashboard'],
    queryFn: () => nfseApi.list({ page: 1, limit: 1000 }),
  });

  const items = data?.data || [];

  const stats = useMemo(() => {
    const total = items.length;
    const authorized = items.filter(n => n.status === 'AUTHORIZED');
    const totalAuthorized = authorized.reduce((sum, n) => sum + (n.valorServico || 0), 0);
    const successRate = total > 0 ? ((authorized.length / total) * 100).toFixed(1) : '0';
    const pending = items.filter(n => n.status === 'PENDING').length;

    // Status distribution
    const statusCounts: Record<string, number> = {};
    items.forEach(n => {
      statusCounts[n.status] = (statusCounts[n.status] || 0) + 1;
    });
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // Daily emissions
    const cutoff = subDays(new Date(), period);
    const dailyMap: Record<string, { date: string; total: number; valor: number }> = {};
    for (let i = 0; i < period; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dailyMap[d] = { date: d, total: 0, valor: 0 };
    }
    items.forEach(n => {
      const d = format(new Date(n.createdAt), 'yyyy-MM-dd');
      if (dailyMap[d]) {
        dailyMap[d].total++;
        dailyMap[d].valor += n.valorServico || 0;
      }
    });
    const dailyData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({ ...d, dateLabel: format(new Date(d.date), 'dd/MM') }));

    return { total, totalAuthorized, successRate, pending, statusData, dailyData };
  }, [items, period]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total de Emissões" value={stats.total} icon={FileText} />
        <KpiCard
          title="Total Autorizado"
          value={`R$ ${stats.totalAuthorized.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
        />
        <KpiCard title="Taxa de Sucesso" value={`${stats.successRate}%`} icon={CheckCircle} />
        <KpiCard title="Pendências" value={stats.pending} icon={Clock} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Donut - Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Emissões por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {stats.statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#ccc'} />
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

        {/* Bar - Daily emissions */}
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
              <BarChart data={stats.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dateLabel" fontSize={11} tickLine={false} />
                <YAxis fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Emissões" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Area - Valor emitido */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Valor Emitido (R$)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.dailyData}>
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
