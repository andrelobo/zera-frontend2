import React, { useMemo } from 'react';
import { Calculator, AlertTriangle, Info, TrendingUp } from 'lucide-react';
import { type CalculoSimplesResult, formatCurrency, formatPercent, distanciaProximaFaixa, FAIXAS_ANEXO_III } from '@/utils/simples-nacional';

interface Props {
  cnaePrincipal: string;
  cnaeDescricao: string;
  cnaeAnexo: string;
  rbt12: number;
  onRbt12Change: (value: number) => void;
  calculo: CalculoSimplesResult;
  alertas: string[];
  permiteFatorR: boolean;
}

function applyCurrencyMask(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const SimplesNacionalSection: React.FC<Props> = ({
  cnaePrincipal,
  cnaeDescricao,
  cnaeAnexo,
  rbt12,
  onRbt12Change,
  calculo,
  alertas,
  permiteFatorR,
}) => {
  const rbt12Display = useMemo(() => {
    if (rbt12 === 0) return '';
    return rbt12.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [rbt12]);

  const distancia = useMemo(() => distanciaProximaFaixa(rbt12), [rbt12]);

  const handleRbt12Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyCurrencyMask(e.target.value);
    const numValue = parseFloat(masked.replace(/\./g, '').replace(',', '.')) || 0;
    onRbt12Change(numValue);
  };

  const formatCNAECode = (codigo: string): string => {
    const str = codigo.replace(/\D/g, '').padStart(7, '0');
    if (str.length >= 7) return `${str.slice(0, 4)}-${str.slice(4, 5)}/${str.slice(5, 7)}`;
    return str;
  };

  return (
    <div className="section-card p-3">
      <h2 className="section-title text-sm mb-2">
        <Calculator className="w-4 h-4 text-primary" />
        Simples Nacional – Anexo III
      </h2>

      {/* RBT12 Input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
        <div>
          <label className="field-label text-xs">RBT12 – Receita Bruta 12 meses (R$)*</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
            <input
              className="field-input pl-9 py-1.5 text-sm"
              placeholder="0,00"
              value={rbt12Display}
              onChange={handleRbt12Change}
            />
          </div>
        </div>

        <div>
          <label className="field-label text-xs">Anexo do Simples</label>
          <input
            className="field-input bg-muted/50 py-1.5 text-sm"
            value={cnaeAnexo ? `Anexo ${cnaeAnexo}` : 'Não identificado'}
            readOnly
          />
        </div>
      </div>

      {/* Resultados calculados */}
      {calculo.valido && calculo.faixa && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
          <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Faixa</p>
            <p className="text-base font-bold text-primary">{calculo.faixa.faixa}ª</p>
            <p className="text-[9px] text-muted-foreground">
              até {formatCurrency(calculo.faixa.limiteSuperior)}
            </p>
          </div>

          <div className="p-2 rounded-lg bg-muted/30 border border-border">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Alíq. Nominal</p>
            <p className="text-base font-bold text-foreground">{formatPercent(calculo.faixa.aliquotaNominal)}</p>
          </div>

          <div className="p-2 rounded-lg bg-muted/30 border border-border">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Parcela Deduzir</p>
            <p className="text-base font-bold text-foreground">{formatCurrency(calculo.faixa.parcelaDeduzir)}</p>
          </div>

          <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
            <p className="text-[9px] uppercase tracking-wider text-primary mb-0.5">Alíq. Efetiva</p>
            <p className="text-lg font-bold text-primary">{formatPercent(calculo.aliquotaEfetiva)}</p>
          </div>

          <div className="p-2 rounded-lg bg-muted/30 border border-border">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">% ISS (ref.)</p>
            <p className="text-base font-bold text-foreground">{formatPercent(calculo.issReferencia)}</p>
          </div>
        </div>
      )}

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="space-y-1.5">
          {alertas.map((alerta, i) => {
            const isWarning = alerta.includes('desenquadramento') || alerta.includes('não pertence');
            const isInfo = alerta.includes('Fator R') || alerta.includes('Informe');
            return (
              <div
                key={i}
                className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${
                  isWarning
                    ? 'bg-destructive/10 border-destructive/20 text-destructive'
                    : isInfo
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300'
                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-300'
                }`}
              >
                {isWarning ? <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                <span>{alerta}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabela de referência */}
      {!cnaePrincipal && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-3 justify-center">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Selecione um CNAE principal na seção de Parametrização de CNAE para calcular automaticamente.</span>
        </div>
      )}
    </div>
  );
};

export default SimplesNacionalSection;
