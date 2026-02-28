import React from 'react';
import {
  DollarSign, FileText, TrendingUp, TrendingDown, Percent, ShieldCheck, AlertTriangle,
  AlertCircle, BarChart3, PieChart, Wallet, ArrowUpRight, ArrowDownRight, Users, Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@/components/ui/chart';
import {
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { formatCurrency, formatPercent } from '@/utils/simples-nacional';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { CalculoSimplesResult } from '@/utils/simples-nacional';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardProps {
  prestadorId: string | null;
  nomeEmpresa: string;
  rbt12: number;
  cnaeAnexo: string;
  regime: string | null;
}

const PIE_COLORS = [
  'hsl(220, 70%, 50%)', 'hsl(160, 60%, 45%)', 'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 55%)', 'hsl(280, 60%, 55%)', 'hsl(190, 70%, 45%)',
];

const KPICard: React.FC<{
  title: string; value: string; subtitle?: string;
  icon: React.ReactNode; trend?: 'up' | 'down' | null; accent?: string;
}> = ({ title, value, subtitle, icon, trend, accent }) => (
  <Card className="relative overflow-hidden">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{title}</p>
          <p className={`text-lg font-bold ${accent || 'text-foreground'}`}>{value}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">{icon}</div>
      </div>
      {trend && (
        <div className="absolute bottom-2 right-3">
          {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5 text-green-500" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />}
        </div>
      )}
    </CardContent>
  </Card>
);

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="p-1.5 rounded-md bg-primary/10 text-primary">{icon}</div>
    <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">{title}</h3>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ prestadorId, nomeEmpresa, rbt12, cnaeAnexo, regime }) => {
  const { loading, kpis, calculo, dadosMensais, analiseClientes, alertas, fluxoCaixa, splits } = useDashboardData(prestadorId, rbt12, cnaeAnexo);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const pieData = analiseClientes.slice(0, 6).map(c => ({ name: c.nome.substring(0, 20), value: c.faturamento }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">{nomeEmpresa || 'Dashboard Financeiro'}</h1>
        
      </div>

      {/* ALERTAS */}
      {alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map((a, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${
                a.tipo === 'danger' ? 'bg-destructive/10 border-destructive/20 text-destructive'
                : a.tipo === 'warning' ? 'bg-warning/10 border-warning/20 text-warning'
                : 'bg-primary/10 border-primary/20 text-primary'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {a.mensagem}
            </div>
          ))}
        </div>
      )}

      {/* 1) RESUMO EXECUTIVO - KPIs */}
      <section>
        <SectionTitle icon={<BarChart3 className="w-4 h-4" />} title="Fiscal IA" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KPICard title="Receita Jan 2026" value={formatCurrency(kpis.faturamentoMes)} icon={<DollarSign className="w-4 h-4" />} />
          <KPICard title="DAS Estimado" value={formatCurrency(kpis.dasEstimado)} icon={<Wallet className="w-4 h-4" />} accent="text-destructive" />
          <KPICard title="Alíq. Efetiva" value={formatPercent(kpis.aliquotaEfetiva)} icon={<Percent className="w-4 h-4" />} />
        </div>
      </section>

      {/* 2) CÁLCULO ANEXO III */}
      <section>
        <SectionTitle icon={<ShieldCheck className="w-4 h-4" />} title="Cálculo Automático – Anexo III" />
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Receita 12m</p>
                <p className="text-sm font-bold">{formatCurrency(rbt12)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Faixa</p>
                <p className="text-sm font-bold">{calculo.faixa ? `${calculo.faixa.faixa}ª` : '–'}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Alíq. Nominal</p>
                <p className="text-sm font-bold">{calculo.faixa ? formatPercent(calculo.faixa.aliquotaNominal) : '–'}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Parcela Deduzir</p>
                <p className="text-sm font-bold">{calculo.faixa ? formatCurrency(calculo.faixa.parcelaDeduzir) : '–'}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Alíq. Efetiva</p>
                <p className="text-sm font-bold text-primary">{calculo.valido ? formatPercent(calculo.aliquotaEfetiva) : '–'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3) GRÁFICOS */}
      <section>
        <SectionTitle icon={<BarChart3 className="w-4 h-4" />} title="Gráficos" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Faturamento + Tributo Mensal */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Faturamento & Tributo Mensal</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosMensais}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="faturamento" stroke="hsl(220, 70%, 50%)" name="Faturamento" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="tributoEstimado" stroke="hsl(0, 72%, 55%)" name="Tributo Est." strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ISS Retido */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ISS Retido por Mês</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosMensais}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="issRetido" fill="hsl(160, 60%, 45%)" name="ISS Retido" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pizza por cliente */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Faturamento por Cliente</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 9 }}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </RechartsPie>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>
              )}
            </CardContent>
          </Card>

          {/* Fluxo de Caixa */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fluxo de Caixa</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <FlowItem label="Caixa Operacional" value={fluxoCaixa.operacional} color="text-green-600" />
                <FlowItem label="Caixa Tributário" value={-fluxoCaixa.tributario} color="text-destructive" subtitle="DAS + ISS retido" />
                <div className="border-t border-border pt-3">
                  <FlowItem label="Saldo Disponível" value={fluxoCaixa.saldo} color={fluxoCaixa.saldo >= 0 ? 'text-green-600' : 'text-destructive'} bold />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 4) SPLIT PAYMENT */}
      <section>
        <SectionTitle icon={<Wallet className="w-4 h-4" />} title="Split Payment" />
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-[10px] text-muted-foreground uppercase">Total Reservado</p>
                <p className="text-lg font-bold">{formatCurrency(kpis.totalReservado)}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-[10px] text-muted-foreground uppercase">% Protegido</p>
                <p className="text-lg font-bold">{kpis.faturamentoMes > 0 ? ((kpis.totalReservado / kpis.faturamentoMes) * 100).toFixed(1) : '0'}%</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-[10px] text-muted-foreground uppercase">Saldo Tributário</p>
                <p className="text-lg font-bold">{formatCurrency(kpis.totalReservado - kpis.dasEstimado)}</p>
              </div>
            </div>
            {splits.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 px-2">NF</th>
                      <th className="text-right py-2 px-2">Bruto</th>
                      <th className="text-right py-2 px-2">Reservado</th>
                      <th className="text-right py-2 px-2">Liberado</th>
                      <th className="text-center py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {splits.slice(0, 10).map(s => (
                      <tr key={s.id} className="border-b border-border/50">
                        <td className="py-2 px-2 font-mono">{s.nota_fiscal_id?.substring(0, 8)}...</td>
                        <td className="text-right py-2 px-2">{formatCurrency(s.valor_bruto)}</td>
                        <td className="text-right py-2 px-2 text-destructive">{formatCurrency(s.valor_reservado)}</td>
                        <td className="text-right py-2 px-2 text-green-600">{formatCurrency(s.valor_liberado)}</td>
                        <td className="text-center py-2 px-2">
                          <Badge variant={s.status === 'pago' ? 'default' : 'outline'} className="text-[9px]">{s.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">Nenhum split registrado ainda.</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 5) ANÁLISE POR CLIENTE */}
      <section>
        <SectionTitle icon={<Users className="w-4 h-4" />} title="Análise por Cliente – Curva ABC" />
        <Card>
          <CardContent className="p-4">
            {analiseClientes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 px-2">Cliente</th>
                      <th className="text-right py-2 px-2">Faturamento</th>
                      <th className="text-right py-2 px-2">NFs</th>
                      <th className="text-right py-2 px-2">Ticket Médio</th>
                      <th className="text-right py-2 px-2">%</th>
                      <th className="text-center py-2 px-2">Curva</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analiseClientes.map(c => (
                      <tr key={c.tomadorId} className="border-b border-border/50">
                        <td className="py-2 px-2 font-medium truncate max-w-[200px]">{c.nome}</td>
                        <td className="text-right py-2 px-2">{formatCurrency(c.faturamento)}</td>
                        <td className="text-right py-2 px-2">{c.quantidadeNf}</td>
                        <td className="text-right py-2 px-2">{formatCurrency(c.ticketMedio)}</td>
                        <td className="text-right py-2 px-2">{c.percentual.toFixed(1)}%</td>
                        <td className="text-center py-2 px-2">
                          <Badge variant={c.classificacao === 'A' ? 'default' : 'outline'} className={`text-[9px] ${
                            c.classificacao === 'A' ? 'bg-green-600' : c.classificacao === 'B' ? 'bg-primary' : ''
                          }`}>
                            {c.classificacao}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">Nenhuma nota fiscal emitida ainda.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

const FlowItem: React.FC<{ label: string; value: number; color: string; subtitle?: string; bold?: boolean }> = ({ label, value, color, subtitle, bold }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className={`text-sm ${bold ? 'font-bold' : 'font-medium'}`}>{label}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
    </div>
    <p className={`text-sm font-bold ${color}`}>{formatCurrency(value)}</p>
  </div>
);

export default Dashboard;
