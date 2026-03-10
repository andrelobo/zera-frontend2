import React, { useMemo } from 'react';
import type { NotaDashboard } from '@/hooks/useDashboardData';
import { formatCurrency } from '@/utils/simples-nacional';

interface ConfigItem {
  id: string;
  natureza: string;
  descricao: string;
}

interface Props {
  notas: NotaDashboard[];
  mesCompetencia: string;
  configOperacionais?: ConfigItem[];
}

const COR_BAR = 'hsl(220, 60%, 55%)';

interface ServicoAgregado {
  natureza: string;
  descricao: string;
  qtd: number;
  receita: number;
  percentual: number;
}

const ServicosExecutados: React.FC<Props> = ({ notas, mesCompetencia, configOperacionais = [] }) => {
  const dados = useMemo<ServicoAgregado[]>(() => {
    const notasMes = notas.filter(n => {
      const d = new Date(n.data_emissao);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === mesCompetencia;
    });

    // Build a lookup: description fragment → natureza
    const descToNatureza = new Map<string, string>();
    configOperacionais.forEach(c => {
      if (c.descricao) descToNatureza.set(c.descricao.trim().toLowerCase(), c.natureza);
    });

    const findNatureza = (descNota: string): string => {
      const descLower = descNota.trim().toLowerCase();
      // Try exact match first
      for (const [desc, nat] of descToNatureza) {
        if (descLower.includes(desc) || desc.includes(descLower)) return nat;
      }
      return 'Outros';
    };

    const map = new Map<string, { natureza: string; descricao: string; qtd: number; receita: number }>();
    notasMes.forEach(n => {
      const desc = 'Serviço não especificado';
      const natureza = findNatureza(desc);
      const key = natureza;
      if (!map.has(key)) map.set(key, { natureza, descricao: desc, qtd: 0, receita: 0 });
      const entry = map.get(key)!;
      entry.qtd += 1;
      entry.receita += n.valor_servico;
    });

    const totalReceita = Array.from(map.values()).reduce((s, e) => s + e.receita, 0);

    return Array.from(map.values())
      .map(e => ({
        natureza: e.natureza,
        descricao: e.descricao,
        qtd: e.qtd,
        receita: e.receita,
        percentual: totalReceita > 0 ? (e.receita / totalReceita) * 100 : 0,
      }))
      .sort((a, b) => b.receita - a.receita);
  }, [notas, mesCompetencia, configOperacionais]);

  if (dados.length === 0) {
    return <p className="text-[9px] text-muted-foreground text-center py-4">Sem serviços no período</p>;
  }

  const maxReceita = Math.max(...dados.map(d => d.receita));

  return (
    <div className="flex flex-col gap-2">
      {dados.map((s, i) => {
        const barWidth = maxReceita > 0 ? (s.receita / maxReceita) * 100 : 0;
        return (
          <div key={i} className="space-y-0.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-[8px] font-bold text-primary">{s.natureza}</span>
              </div>
              <span className="text-[8px] text-muted-foreground shrink-0">{s.qtd} NF{s.qtd > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-2.5 bg-muted/40 rounded-sm overflow-hidden">
                <div className="h-full rounded-sm transition-all" style={{ width: `${barWidth}%`, backgroundColor: COR_BAR }} />
              </div>
              <span className="text-[7px] font-bold tabular-nums shrink-0" style={{ color: COR_BAR }}>
                {formatCurrency(s.receita)}
              </span>
              <span className="text-[7px] text-muted-foreground tabular-nums shrink-0">
                {s.percentual.toFixed(0)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ServicosExecutados;
