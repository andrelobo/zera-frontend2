import React, { useMemo } from 'react';
import type { NotaDashboard } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  notas: NotaDashboard[];
  tomadores: Record<string, { nome: string; subTrib: boolean }>;
  aliquotaEfetiva: number;
  loading?: boolean;
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const EmissoesResumoMini: React.FC<Props> = ({ notas, tomadores, aliquotaEfetiva, loading = false }) => {
  const linhas = useMemo(() => {
    const totalGeral = notas.reduce((s, n) => s + n.valor_servico, 0);

    return notas.map(n => {
      const d = new Date(n.data_emissao);
      const dataFmt = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      const tom = tomadores[n.tomador_id || ''];
      const nome = tom?.nome || 'Sem tomador';
      const subTrib = tom?.subTrib || false;
      const vs = n.valor_servico;
      const issRet = n.iss_retido ? n.iss_valor : 0;
      const aliqIss = n.iss_retido ? n.aliquota : 0;
      const simples = vs * aliquotaEfetiva;
      const das = Math.max(simples - issRet, 0);
      const percentual = totalGeral > 0 ? (vs / totalGeral) * 100 : 0;

      return { dataFmt, nome, subTrib, vs, issRet, aliqIss, simples, das, percentual };
    });
  }, [notas, tomadores, aliquotaEfetiva]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <Skeleton className="h-3 w-10 rounded-sm" />
            <Skeleton className="h-3 flex-1 rounded-sm" />
            <Skeleton className="h-3 w-10 rounded-sm" />
            <Skeleton className="h-3 w-16 rounded-sm" />
            <Skeleton className="h-3 w-14 rounded-sm" />
            <Skeleton className="h-3 w-12 rounded-sm" />
            <Skeleton className="h-3 w-16 rounded-sm" />
          </div>
        ))}
      </div>
    );
  }

  if (linhas.length === 0) return null;

  const totais = linhas.reduce(
    (acc, l) => ({
      vs: acc.vs + l.vs,
      issRet: acc.issRet + l.issRet,
      simples: acc.simples + l.simples,
      das: acc.das + l.das,
      percentual: acc.percentual + l.percentual,
    }),
    { vs: 0, issRet: 0, simples: 0, das: 0, percentual: 0 },
  );

  return (
    <div className="h-full flex flex-col justify-between gap-1 overflow-x-auto">
      {/* Header */}
      <div className="flex items-center gap-2 text-[9px] font-semibold text-muted-foreground uppercase">
        <span className="w-10 shrink-0">Data</span>
        <span className="flex-1 truncate">Tomador</span>
        <span className="w-10 text-center">SubTrib</span>
        <span className="w-16 text-right">Receita</span>
        <span className="w-14 text-right">ISSQN(R)</span>
        <span className="w-12 text-right">AliqSn</span>
        <span className="w-16 text-right">DASN</span>
      </div>

      {/* Rows */}
      {linhas.map((l, i) => (
        <div key={i} className="flex items-center gap-2 text-[9px] tabular-nums">
          <span className="w-10 shrink-0 text-muted-foreground">{l.dataFmt}</span>
          <span className="flex-1 truncate text-foreground font-medium">{l.nome}</span>
          <span className="w-10 text-center">
            {l.subTrib ? (
              <span className="text-[8px] bg-accent/15 text-accent rounded-full px-1.5 py-0.5 font-semibold">Sim</span>
            ) : (
              <span className="text-[8px] text-muted-foreground">Não</span>
            )}
          </span>
          <span className="w-16 text-right text-foreground">{fmt(l.vs)}</span>
          <span className="w-14 text-right text-foreground">
            {l.issRet > 0 ? `(${fmt(l.issRet)})` : '—'}
          </span>
          <span className="w-12 text-right text-muted-foreground">{fmt(aliquotaEfetiva * 100)}%</span>
          <span className="w-16 text-right font-bold text-destructive">{fmt(l.das)}</span>
        </div>
      ))}

      {/* Footer */}
      <div className="flex items-center gap-2 text-[9px] font-bold border-t border-border pt-1 tabular-nums mt-auto">
        <span className="w-10 shrink-0" />
        <span className="flex-1 text-foreground">Total</span>
        <span className="w-10" />
        <span className="w-16 text-right text-foreground">{fmt(totais.vs)}</span>
        <span className="w-14 text-right text-foreground">{totais.issRet > 0 ? `(${fmt(totais.issRet)})` : '—'}</span>
        <span className="w-12 text-right" />
        <span className="w-16 text-right text-destructive">{fmt(totais.das)}</span>
      </div>
    </div>
  );
};

export default EmissoesResumoMini;
