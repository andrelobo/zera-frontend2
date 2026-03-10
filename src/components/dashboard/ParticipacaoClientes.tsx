import React from 'react';
import type { ClienteAnalise } from '@/hooks/useDashboardData';
import { formatCurrency } from '@/utils/simples-nacional';

interface Props {
  analiseClientes: ClienteAnalise[];
  aliquotaEfetiva?: number;
}

const COR_RECEITA = 'hsl(220, 60%, 55%)';
const COR_TRIBUTO = 'hsl(0, 65%, 50%)';

const ParticipacaoClientes: React.FC<Props> = ({ analiseClientes, aliquotaEfetiva = 0 }) => {
  const top = analiseClientes.slice(0, 6);

  if (top.length === 0) {
    return <p className="text-[9px] text-muted-foreground text-center py-4">Sem dados de clientes</p>;
  }

  const maxReceita = Math.max(...top.map(c => c.faturamento));

  return (
    <div className="flex flex-col gap-1.5">
      {top.map(c => {
        const tributo = c.faturamento * aliquotaEfetiva;
        const receitaPct = maxReceita > 0 ? (c.faturamento / maxReceita) * 100 : 0;
        const tributoPct = maxReceita > 0 ? (tributo / maxReceita) * 100 : 0;

        return (
          <div key={c.tomadorId} className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-semibold text-foreground truncate max-w-[55%]">{c.nome}</span>
              <span className="text-[8px] text-muted-foreground tabular-nums">{c.percentual.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex-1 h-2 bg-muted/40 rounded-sm overflow-hidden">
                <div className="h-full rounded-sm transition-all" style={{ width: `${receitaPct}%`, backgroundColor: COR_RECEITA }} />
              </div>
              <span className="text-[7px] font-bold tabular-nums shrink-0" style={{ color: COR_RECEITA }}>{formatCurrency(c.faturamento)}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex-1 h-1.5 bg-muted/40 rounded-sm overflow-hidden">
                <div className="h-full rounded-sm transition-all" style={{ width: `${tributoPct}%`, backgroundColor: COR_TRIBUTO }} />
              </div>
              <span className="text-[7px] font-bold tabular-nums shrink-0" style={{ color: COR_TRIBUTO }}>
                {formatCurrency(tributo)} ({(aliquotaEfetiva * 100).toFixed(2)}%)
              </span>
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-3 pt-0.5 border-t border-border">
        <span className="flex items-center gap-1 text-[7px] text-muted-foreground"><span className="w-1.5 h-1.5 rounded-sm inline-block" style={{ backgroundColor: COR_RECEITA }} /> Receita</span>
        <span className="flex items-center gap-1 text-[7px] text-muted-foreground"><span className="w-1.5 h-1.5 rounded-sm inline-block" style={{ backgroundColor: COR_TRIBUTO }} /> Tributos</span>
      </div>
    </div>
  );
};

export default ParticipacaoClientes;
