import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, TrendingDown, Percent, ShieldCheck, Scale, Receipt, Landmark, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { NotaDashboard } from '@/hooks/useDashboardData';
import {
  PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
  Bar, BarChart, Line, ComposedChart,
} from 'recharts';
import { FAIXAS_ANEXO_III, formatCurrency, formatPercent, calcularSimplesAnexoIII } from '@/utils/simples-nacional';
import type { CalculoSimplesResult } from '@/utils/simples-nacional';
import type { MesData } from '@/hooks/useDashboardData';
import DashboardCard from './DashboardCard';
import FaixaThermometer from './FaixaThermometer';
import SimuladorCenario from './SimuladorCenario';
import EmissoesResumoMini from './EmissoesResumoMini';
import ParticipacaoClientes from './ParticipacaoClientes';
import ServicosExecutados from './ServicosExecutados';
import type { ClienteAnalise } from '@/hooks/useDashboardData';

interface Props {
  rbt12: number;
  cnaeAnexo: string;
  calculo: CalculoSimplesResult;
  kpis: {
    faturamentoMes: number;
    dasEstimado: number;
    dasAPagar: number;
    issRetidoMes: number;
    totalRetencoes: number;
    aliquotaEfetiva: number;
    competenciaLabel: string;
    mesCompetencia: string;
  };
  dadosMensais: MesData[];
  notas: NotaDashboard[];
  tomadores: Record<string, { nome: string; subTrib: boolean }>;
  analiseClientes: ClienteAnalise[];
  configOperacionais?: { id: string; natureza: string; descricao: string }[];
  simuladorContent?: React.ReactNode;
  splitPaymentContent?: React.ReactNode;
}

const CHART_GREEN = 'hsl(160, 60%, 45%)';

const PIE_COLORS = [
  'hsl(160, 60%, 45%)', 'hsl(160, 40%, 60%)', 'hsl(160, 30%, 72%)',
  'hsl(38, 80%, 55%)', 'hsl(220, 60%, 55%)', 'hsl(280, 50%, 55%)',
];

const SimplesNacionalDashboard: React.FC<Props> = ({ rbt12, cnaeAnexo, calculo, kpis, dadosMensais, notas, tomadores, analiseClientes, configOperacionais = [], simuladorContent, splitPaymentContent }) => {
  const monthLabelFromYearMonth = (yearMonth: string): string => {
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) return yearMonth;
    const [year, month] = yearMonth.split('-');
    return `${month}/${year}`;
  };

  const competenciaOptions = useMemo(() => {
    const map = new Map<string, string>();

    dadosMensais
      .filter((item) => item.mes && /^\d{4}-\d{2}$/.test(item.mes))
      .forEach((item) => {
        map.set(item.mes, item.label || monthLabelFromYearMonth(item.mes));
      });

    notas.forEach((nota) => {
      const raw = nota.data_emissao || '';
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return;
      const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map.has(mes)) map.set(mes, monthLabelFromYearMonth(mes));
    });

    const valid = Array.from(map.entries())
      .map(([mes, label]) => ({ mes, label }))
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .reverse();

    if (valid.length > 0) return valid;
    if (kpis.mesCompetencia && /^\d{4}-\d{2}$/.test(kpis.mesCompetencia)) {
      return [{ mes: kpis.mesCompetencia, label: kpis.competenciaLabel }];
    }
    return [];
  }, [dadosMensais, kpis.competenciaLabel, kpis.mesCompetencia, notas]);

  const [mesSelecionado, setMesSelecionado] = useState<string>(
    competenciaOptions[0]?.mes || kpis.mesCompetencia || '',
  );

  useEffect(() => {
    const existe = competenciaOptions.some((item) => item.mes === mesSelecionado);
    if (!existe) {
      setMesSelecionado(competenciaOptions[0]?.mes || kpis.mesCompetencia || '');
    }
  }, [competenciaOptions, kpis.mesCompetencia, mesSelecionado]);

  const competenciaSelecionadaLabel = useMemo(() => {
    const selected = competenciaOptions.find((item) => item.mes === mesSelecionado);
    if (selected?.label) return selected.label;
    if (kpis.competenciaLabel && !kpis.competenciaLabel.toLowerCase().includes('sem comp')) return kpis.competenciaLabel;
    return 'MÊS ATUAL';
  }, [competenciaOptions, kpis.competenciaLabel, mesSelecionado]);

  const notasMesSelecionado = useMemo(() => {
    if (!mesSelecionado) return notas;
    return notas.filter((nota) => {
      const d = new Date(nota.data_emissao || '');
      if (Number.isNaN(d.getTime())) return false;
      const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return mes === mesSelecionado;
    });
  }, [mesSelecionado, notas]);

  const kpisMesSelecionado = useMemo(() => {
    const mesData = dadosMensais.find((item) => item.mes === mesSelecionado);
    const faturamentoMes = mesData?.faturamento ?? notasMesSelecionado.reduce((acc, item) => acc + item.valor_servico, 0);
    const issRetidoMes = mesData?.issRetido ?? notasMesSelecionado.reduce((acc, item) => acc + (item.iss_retido ? item.iss_valor : 0), 0);
    const dasEstimado = mesData?.tributoEstimado ?? (faturamentoMes * (kpis.aliquotaEfetiva || 0));
    const totalRetencoes = notasMesSelecionado.reduce(
      (acc, item) => acc + (item.ret_pis || 0) + (item.ret_cofins || 0) + (item.ret_csll || 0) + (item.ret_ir || 0) + (item.ret_inss || 0),
      0,
    );
    const dasAPagar = Math.max(dasEstimado - issRetidoMes, 0);

    return {
      ...kpis,
      competenciaLabel: competenciaSelecionadaLabel,
      mesCompetencia: mesSelecionado || kpis.mesCompetencia,
      faturamentoMes,
      issRetidoMes,
      dasEstimado,
      dasAPagar,
      totalRetencoes,
    };
  }, [competenciaSelecionadaLabel, dadosMensais, kpis, mesSelecionado, notasMesSelecionado]);

  const composicaoTributaria = useMemo(() => {
    if (!calculo.faixa || !calculo.valido) return [];
    const aliqEfetiva = calculo.aliquotaEfetiva;
    const percISS = calculo.faixa.percentualIss;
    const percIRPJ = 0.04;
    const percCSLL = 0.035;
    const percCOFINS = 0.1282;
    const percPIS = 0.0278;
    const percCPP = 1 - percISS - percIRPJ - percCSLL - percCOFINS - percPIS;

    const issCalculado = kpisMesSelecionado.faturamentoMes * aliqEfetiva * percISS;
    const issLiquido = Math.max(issCalculado - kpisMesSelecionado.issRetidoMes, 0);

    return [
      { tributo: 'ISS', percentual: percISS, aliquota: aliqEfetiva * percISS, valor: issLiquido, valorBruto: issCalculado, issRetido: kpis.issRetidoMes, cor: PIE_COLORS[0] },
      { tributo: 'CPP', percentual: percCPP, aliquota: aliqEfetiva * percCPP, valor: kpisMesSelecionado.faturamentoMes * aliqEfetiva * percCPP, cor: PIE_COLORS[1] },
      { tributo: 'IRPJ', percentual: percIRPJ, aliquota: aliqEfetiva * percIRPJ, valor: kpisMesSelecionado.faturamentoMes * aliqEfetiva * percIRPJ, cor: PIE_COLORS[2] },
      { tributo: 'CSLL', percentual: percCSLL, aliquota: aliqEfetiva * percCSLL, valor: kpisMesSelecionado.faturamentoMes * aliqEfetiva * percCSLL, cor: PIE_COLORS[3] },
      { tributo: 'COFINS', percentual: percCOFINS, aliquota: aliqEfetiva * percCOFINS, valor: kpisMesSelecionado.faturamentoMes * aliqEfetiva * percCOFINS, cor: PIE_COLORS[4] },
      { tributo: 'PIS', percentual: percPIS, aliquota: aliqEfetiva * percPIS, valor: kpisMesSelecionado.faturamentoMes * aliqEfetiva * percPIS, cor: PIE_COLORS[5] },
    ];
  }, [calculo, kpisMesSelecionado.faturamentoMes, kpisMesSelecionado.issRetidoMes]);

  const evolucaoMensal = useMemo(() => {
    return dadosMensais.map(m => ({
      label: m.label,
      receita: m.faturamento,
      das: m.tributoEstimado,
      cargaTributaria: m.faturamento > 0 ? +((m.tributoEstimado / m.faturamento) * 100).toFixed(2) : 0,
    }));
  }, [dadosMensais]);

  const pieComposicao = composicaoTributaria.map(c => ({
    name: c.tributo,
    value: c.valor,
    percentual: c.percentual,
    aliquota: c.aliquota,
  }));

  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, payload }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const aliq = payload?.aliquota ?? 0;
    if (aliq < 0.001) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={7} fontWeight="bold">
        {`${(aliq * 100).toFixed(2)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-3">
      {/* Row 1: Policia Federal + Split Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <DashboardCard title="Simulador Simples Nacional" headerColor="orange">
          {simuladorContent}
        </DashboardCard>
        {splitPaymentContent}
      </div>

      {/* Row 2: Apuração + Partilha | Termômetro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
        <div className="flex flex-col gap-3">
          <DashboardCard title={`A Recolher ${kpisMesSelecionado.competenciaLabel}`} headerColor="red">
            <div className="flex flex-col gap-1">
              <FinRow icon={<DollarSign className="w-3 h-3" />} label="Faturamento Bruto" value={formatCurrency(kpisMesSelecionado.faturamentoMes)} accent="text-foreground" />
              <FinRow icon={<TrendingDown className="w-3 h-3" />} label="Tributos Estimados" value={formatCurrency(kpisMesSelecionado.dasEstimado)} accent="text-destructive" />
              <FinRow icon={<Percent className="w-3 h-3" />} label="Alíquota Efetiva" value={formatPercent(kpisMesSelecionado.aliquotaEfetiva)} accent="text-primary" />
              <FinRow icon={<ShieldCheck className="w-3 h-3" />} label="Retido ISS (T)" value={`(${formatCurrency(kpisMesSelecionado.issRetidoMes)})`} accent="text-accent" />
              <FinRow icon={<Scale className="w-3 h-3" />} label="Alíquota ISS" value={calculo.valido ? formatPercent(calculo.issReferencia) : '–'} accent="text-foreground" />
              <FinRow icon={<Receipt className="w-3 h-3" />} label="Retenções" value={formatCurrency(kpisMesSelecionado.totalRetencoes)} accent="text-muted-foreground" />
              <div className="border-t border-border pt-0.5 flex items-center gap-2 text-[9px] font-bold mt-0.5 text-destructive">
                <Landmark className="w-3 h-3" />
                <span className="shrink-0 font-extrabold">A RECOLHER PGDAS</span>
                <div className="flex-1" />
                <span className="tabular-nums font-extrabold">{formatCurrency(kpisMesSelecionado.dasAPagar)}</span>
              </div>
            </div>
          </DashboardCard>

          <PartilhaCollapsible
            composicaoTributaria={composicaoTributaria}
            aliquotaEfetiva={kpisMesSelecionado.aliquotaEfetiva}
            dasAPagar={kpisMesSelecionado.dasAPagar}
            issRetidoMes={kpisMesSelecionado.issRetidoMes}
            faturamentoMes={kpisMesSelecionado.faturamentoMes}
          />
        </div>

        <DashboardCard title="Termômetro Simples Nacional" headerColor="blue">
          <FaixaThermometer rbt12={rbt12} calculo={calculo} />
        </DashboardCard>
      </div>

      {/* Row 3: Emitidas + Participação Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
        <DashboardCard title={`EMITIDAS NFSE ${competenciaSelecionadaLabel.toUpperCase()}`} headerColor="green">
          {competenciaOptions.length > 0 && (
            <div className="mb-2">
              <label className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                Competência
              </label>
              <select
                className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs"
                value={mesSelecionado}
                onChange={(event) => setMesSelecionado(event.target.value)}
              >
                {competenciaOptions.map((item) => (
                  <option key={item.mes} value={item.mes}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <EmissoesResumoMini
            notas={notas}
            tomadores={tomadores}
            aliquotaEfetiva={kpisMesSelecionado.aliquotaEfetiva}
            mesCompetencia={mesSelecionado || kpis.mesCompetencia}
          />
        </DashboardCard>
        <DashboardCard title="Participação por Cliente" headerColor="blue">
          <ParticipacaoClientes analiseClientes={analiseClientes} aliquotaEfetiva={kpisMesSelecionado.aliquotaEfetiva} />
        </DashboardCard>
      </div>

    </div>
  );
};

/* Sub-component for Financeiro rows */
const FinRow: React.FC<{ icon?: React.ReactNode; label: string; value: string; accent?: string }> = ({ icon, label, value, accent = 'text-foreground' }) => (
  <div className="flex items-center gap-1.5 text-[9px]">
    {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
    <span className="w-28 font-semibold text-muted-foreground shrink-0">{label}</span>
    <div className="flex-1" />
    <span className={`tabular-nums font-bold ${accent}`}>{value}</span>
  </div>
);

/* Sub-component for collapsible Partilha Pgdas */
const PartilhaCollapsible: React.FC<{
  composicaoTributaria: { tributo: string; percentual: number; aliquota: number; valor: number; valorBruto?: number; issRetido?: number; cor: string }[];
  aliquotaEfetiva: number;
  dasAPagar: number;
  issRetidoMes: number;
  faturamentoMes: number;
}> = ({ composicaoTributaria, aliquotaEfetiva, dasAPagar, issRetidoMes, faturamentoMes }) => {
  const [aberto, setAberto] = useState(false);

  if (composicaoTributaria.length === 0 || faturamentoMes <= 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full px-3 py-1 flex items-center justify-between bg-[hsl(220,60%,50%)] text-white"
      >
        <h3 className="text-[10px] font-bold uppercase tracking-wider">Partilha Pgdas</h3>
        {aberto ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      <div className="px-2 py-1.5">
        <div className="flex items-center gap-2 text-[9px] font-bold">
          <span className="shrink-0">A RECOLHER PGDAS</span>
          <div className="flex-1" />
          <span className="w-12 text-right tabular-nums">{formatPercent(aliquotaEfetiva)}</span>
          <span className="w-16 text-right tabular-nums text-destructive">{formatCurrency(dasAPagar)}</span>
        </div>
      </div>
      {aberto && (
        <div className="px-2 pb-2 flex flex-col gap-1">
          {composicaoTributaria.map(c => {
            const maxPerc = Math.max(...composicaoTributaria.map(t => t.percentual));
            const barWidth = maxPerc > 0 ? (c.percentual / maxPerc) * 100 : 0;
            return (
              <div key={c.tributo}>
                <div className="flex items-center gap-2 text-[9px]">
                  <span className="w-10 font-semibold text-muted-foreground shrink-0">{c.tributo}</span>
                  <div className="flex-1 h-3.5 bg-muted/40 rounded-sm overflow-hidden relative">
                    <div
                      className="h-full rounded-sm transition-all"
                      style={{ width: `${barWidth}%`, backgroundColor: c.cor }}
                    />
                  </div>
                  <span className="w-12 text-right tabular-nums text-muted-foreground">{formatPercent(c.aliquota)}</span>
                  <span className="w-16 text-right tabular-nums font-bold text-foreground">{formatCurrency(c.valor)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SimplesNacionalDashboard;
