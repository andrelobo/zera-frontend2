import { useState } from 'react';
import { ChevronDown, Table as TableIcon } from 'lucide-react';
import { FAIXAS_ANEXO_III, formatCurrency, formatPercent } from '@/utils/simples-nacional';

interface Props {
  faixaAtual?: number | null;
}

const TabelaAnexoIII = ({ faixaAtual }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="section-card p-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center justify-between w-full text-left"
      >
        <h2 className="section-title text-sm mb-0 flex items-center gap-1.5">
          <TableIcon className="w-4 h-4 text-primary" />
          Tabela Anexo III
        </h2>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="overflow-auto mt-2">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-1 px-2 text-center font-medium">Faixa</th>
                <th className="py-1 px-2 text-left font-medium">Receita Bruta (12m)</th>
                <th className="py-1 px-2 text-center font-medium">Alíq. Nom.</th>
                <th className="py-1 px-2 text-right font-medium">Deduzir</th>
              </tr>
            </thead>
            <tbody>
              {FAIXAS_ANEXO_III.map((faixa) => (
                <tr
                  key={faixa.faixa}
                  className={`border-b border-border/50 ${faixaAtual === faixa.faixa ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground'}`}
                >
                  <td className="py-1 px-2 text-center">{faixa.faixa}ª</td>
                  <td className="py-1 px-2">
                    {faixa.limiteInferior === 0 ? 'Até' : `${formatCurrency(faixa.limiteInferior)} - `}{formatCurrency(faixa.limiteSuperior)}
                  </td>
                  <td className="py-1 px-2 text-center">{formatPercent(faixa.aliquotaNominal)}</td>
                  <td className="py-1 px-2 text-right">{formatCurrency(faixa.parcelaDeduzir)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TabelaAnexoIII;
