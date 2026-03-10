import React, { useState, useMemo } from 'react';
import { calcularSimplesAnexoIII, formatCurrency, formatPercent } from '@/utils/simples-nacional';
import { Slider } from '@/components/ui/slider';

interface Props {
  rbt12: number;
  cnaeAnexo: string;
  faturamentoAtual: number;
}

const SimuladorCenario: React.FC<Props> = ({ rbt12, cnaeAnexo, faturamentoAtual }) => {
  const [simulado, setSimulado] = useState(faturamentoAtual);

  const resultado = useMemo(() => {
    const novoRbt12 = rbt12 - faturamentoAtual + simulado;
    return calcularSimplesAnexoIII(novoRbt12, cnaeAnexo);
  }, [rbt12, faturamentoAtual, simulado, cnaeAnexo]);

  const dasSimulado = resultado.valido ? simulado * resultado.aliquotaEfetiva : 0;
  const diff = dasSimulado - (faturamentoAtual * (calcularSimplesAnexoIII(rbt12, cnaeAnexo).aliquotaEfetiva || 0));

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[9px] text-muted-foreground uppercase tracking-wide">Faturamento Simulado</label>
        <p className="text-base font-bold text-foreground tabular-nums">{formatCurrency(simulado)}</p>
      </div>
      <Slider
        value={[simulado]}
        onValueChange={([v]) => setSimulado(v)}
        min={0}
        max={Math.max(faturamentoAtual * 3, 30000)}
        step={100}
        className="w-full"
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Alíq. Efetiva</p>
          <p className="text-xs font-bold text-primary tabular-nums">{resultado.valido ? formatPercent(resultado.aliquotaEfetiva) : '–'}</p>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">DAS Estimado</p>
          <p className="text-xs font-bold text-destructive tabular-nums">{formatCurrency(dasSimulado)}</p>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Faixa</p>
          <p className="text-xs font-bold text-foreground">{resultado.valido ? `${resultado.faixa?.faixa}ª` : '–'}</p>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Impacto</p>
          <p className={`text-xs font-bold tabular-nums ${diff > 0 ? 'text-destructive' : 'text-primary'}`}>
            {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimuladorCenario;
