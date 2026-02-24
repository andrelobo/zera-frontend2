import React from 'react';
import { Calculator } from 'lucide-react';

interface Props {
  valorBruto: number;
  desconto: number;
  issValor: number;
  issRetido: boolean;
  retPis: number;
  retCofins: number;
  retCsll: number;
  retIr: number;
  retInss: number;
}

function fmt(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ValoresTotaisSection: React.FC<Props> = ({
  valorBruto, desconto, issValor, issRetido,
  retPis, retCofins, retCsll, retIr, retInss,
}) => {
  const totalRetencoes = (issRetido ? issValor : 0) + retPis + retCofins + retCsll + retIr + retInss;
  const valorLiquido = valorBruto - desconto - totalRetencoes;

  return (
    <div className="section-card">
      <h2 className="section-title">
        <Calculator className="w-5 h-5 text-primary" />
        Valores e Totais
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <span className="text-xs text-muted-foreground">Valor Bruto</span>
          <p className="text-lg font-bold text-foreground">R$ {fmt(valorBruto)}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <span className="text-xs text-muted-foreground">Deduções</span>
          <p className="text-lg font-bold text-foreground">R$ {fmt(desconto)}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <span className="text-xs text-muted-foreground">Impostos / Retenções</span>
          <p className="text-lg font-bold text-foreground">R$ {fmt(totalRetencoes)}</p>
        </div>
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-xs text-primary">Valor Líquido</span>
          <p className="text-lg font-bold text-primary">R$ {fmt(Math.max(0, valorLiquido))}</p>
        </div>
      </div>

      {/* Detalhamento */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs font-bold text-foreground mb-3">Detalhamento</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">ISS {issRetido ? '(retido)' : ''}</span>
            <span className="font-medium text-foreground">R$ {fmt(issValor)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">PIS</span>
            <span className="font-medium text-foreground">R$ {fmt(retPis)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">COFINS</span>
            <span className="font-medium text-foreground">R$ {fmt(retCofins)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">CSLL</span>
            <span className="font-medium text-foreground">R$ {fmt(retCsll)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">IR</span>
            <span className="font-medium text-foreground">R$ {fmt(retIr)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">INSS</span>
            <span className="font-medium text-foreground">R$ {fmt(retInss)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Desconto</span>
            <span className="font-medium text-foreground">R$ {fmt(desconto)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValoresTotaisSection;
