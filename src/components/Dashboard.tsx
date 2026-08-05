import React, { useState, useMemo } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Shield, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercent, calcularSimplesAnexoIII } from '@/utils/simples-nacional';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import SimplesNacionalDashboard from '@/components/dashboard/SimplesNacionalDashboard';
import DashboardCard from '@/components/dashboard/DashboardCard';

interface DashboardProps {
  prestadorId: string | null;
  nomeEmpresa: string;
  rbt12: number;
  cnaeAnexo: string;
  regime: string | null;
  configOperacionais?: { id?: string; natureza?: string; descricao?: string }[];
}

const Dashboard: React.FC<DashboardProps> = ({ prestadorId, nomeEmpresa, rbt12, cnaeAnexo, regime, configOperacionais = [] }) => {
  const {
    loadingCore,
    kpis,
    calculo,
    dadosMensais,
    analiseClientes,
    alertas,
    fluxoCaixa,
    splits,
    rbt12Efetivo,
  } = useDashboardData(prestadorId, rbt12, cnaeAnexo, { includeNotas: false });
  const [simulacaoExtra, setSimulacaoExtra] = useState<string>('');

  const formatCurrencyInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const num = parseInt(digits, 10) / 100;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseCurrencyInput = (formatted: string): number => {
    if (!formatted) return 0;
    return parseFloat(formatted.replace(/\./g, '').replace(',', '.')) || 0;
  };

  if (loadingCore) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 rounded-lg" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  // Smart alerts
  const smartAlerts: { tipo: string; mensagem: string; icon: React.ReactNode }[] = [];
  alertas.forEach(a => {
    smartAlerts.push({
      tipo: a.tipo,
      mensagem: a.mensagem,
      icon: a.tipo === 'danger' ? <AlertTriangle className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />,
    });
  });
  if (kpis.faturamentoMes > 0 && dadosMensais.length >= 2) {
    const prev = dadosMensais[dadosMensais.length - 2]?.faturamento || 0;
    if (prev > 0) {
      const change = ((kpis.faturamentoMes - prev) / prev) * 100;
      if (Math.abs(change) > 5) {
        smartAlerts.push({
          tipo: change > 0 ? 'success' : 'warning',
          mensagem: `Receita ${change > 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(0)}% vs mês anterior`,
          icon: change > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />,
        });
      }
    }
  }

  // Simulação de faixa
  const extraVal = parseCurrencyInput(simulacaoExtra);
  const rbt12Simulado = rbt12 + extraVal;
  const calculoSimulado = extraVal > 0 ? calcularSimplesAnexoIII(rbt12Simulado, cnaeAnexo || 'III') : null;
  const mudouFaixa = calculoSimulado?.faixa && calculo.faixa && calculoSimulado.faixa.faixa !== calculo.faixa.faixa;

  return (
    <div className="space-y-2">

      {/* SMART ALERTS */}
      {smartAlerts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {smartAlerts.map((a, i) => (
            <Badge
              key={i}
              variant="outline"
              className={`text-[10px] gap-1 py-0.5 ${
                a.tipo === 'danger' ? 'border-destructive text-destructive' :
                a.tipo === 'warning' ? 'border-[hsl(38,80%,55%)] text-[hsl(38,80%,45%)]' :
                a.tipo === 'success' ? 'border-accent text-accent' : 'border-primary text-primary'
              }`}
            >
              {a.icon} {a.mensagem}
            </Badge>
          ))}
        </div>
      )}

      {/* SIMPLES NACIONAL SECTION */}
        <SimplesNacionalDashboard
        rbt12={rbt12Efetivo}
        cnaeAnexo={cnaeAnexo}
        calculo={calculo}
        kpis={kpis}
        dadosMensais={dadosMensais}
        analiseClientes={analiseClientes}
        configOperacionais={configOperacionais}
        simuladorContent={
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-end gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground">Projeção Financeira</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={simulacaoExtra}
                    onChange={e => setSimulacaoExtra(formatCurrencyInput(e.target.value))}
                    className="h-8 text-sm pl-9"
                  />
                </div>
              </div>
              {calculoSimulado && (
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">RBT12 simulado:</span>
                    <span className="font-bold">{formatCurrency(rbt12Simulado)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Faixa:</span>
                    <span className={`font-bold ${mudouFaixa ? 'text-destructive' : ''}`}>
                      {calculoSimulado.faixa?.faixa}ª {mudouFaixa && '⚠️'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Alíquota:</span>
                    <span className={`font-bold ${mudouFaixa ? 'text-destructive' : 'text-accent'}`}>
                      {formatPercent(calculoSimulado.aliquotaEfetiva)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Valor Simulado:</span>
                    <span className="font-bold text-destructive">
                      {formatCurrency(parseCurrencyInput(simulacaoExtra) * (calculoSimulado.aliquotaEfetiva || 0))}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {mudouFaixa && (
              <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[10px] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="whitespace-nowrap">
                  <strong>Alerta:</strong> {calculo.faixa!.faixa}ª → {calculoSimulado!.faixa!.faixa}ª faixa | {formatPercent(calculo.aliquotaEfetiva)} → {formatPercent(calculoSimulado!.aliquotaEfetiva)}
                </span>
              </div>
            )}
          </div>
        }
        splitPaymentContent={
          <DashboardCard title="Split Payment LC 214/25" headerColor="green" rightHeader={<span className="text-[8px] font-semibold">⚠️ Em Processo Bancário</span>}>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-1.5">
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <p className="text-[8px] text-muted-foreground uppercase">Receita Recebida</p>
                  <p className="text-xs font-bold text-foreground tabular-nums">{formatCurrency(kpis.faturamentoMes)}</p>
                </div>
                <div className="text-center p-2 rounded-md bg-destructive/5">
                  <p className="text-[8px] text-muted-foreground uppercase">Governo (R)</p>
                  <p className="text-xs font-bold text-destructive tabular-nums">{formatCurrency(kpis.dasEstimado)}</p>
                </div>
                <div className="text-center p-2 rounded-md bg-accent/5">
                  <p className="text-[8px] text-muted-foreground uppercase">Liberado</p>
                  <p className="text-xs font-bold text-accent tabular-nums">{formatCurrency(fluxoCaixa.saldo)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-accent" />
                <div className="flex-1">
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${kpis.faturamentoMes > 0 ? Math.min((kpis.dasEstimado / kpis.faturamentoMes) * 100, 100) : 0}%` }}
                    />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-accent">
                  {kpis.faturamentoMes > 0 ? ((kpis.dasEstimado / kpis.faturamentoMes) * 100).toFixed(1) : 0}% protegido
                </span>
              </div>
              {splits.length > 0 && (
                <div className="overflow-x-auto max-h-32">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-1 px-1">NF</th>
                        <th className="text-right py-1 px-1">Bruto</th>
                        <th className="text-right py-1 px-1">Reservado</th>
                        <th className="text-center py-1 px-1">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {splits.slice(0, 5).map(s => (
                        <tr key={s.id} className="border-b border-border/50">
                          <td className="py-1 px-1 font-mono">{s.nota_fiscal_id?.substring(0, 8)}</td>
                          <td className="text-right py-1 px-1">{formatCurrency(s.valor_bruto)}</td>
                          <td className="text-right py-1 px-1 text-destructive">{formatCurrency(s.valor_reservado)}</td>
                          <td className="text-center py-1 px-1">
                            <Badge variant={s.status === 'pago' ? 'default' : 'outline'} className="text-[8px]">{s.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </DashboardCard>
        }
      />


    </div>
  );
};

export default Dashboard;
