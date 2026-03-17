import React, { useMemo } from 'react';
import { Trash2, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { NotaDashboard } from '@/hooks/useDashboardData';

interface Props {
  notas: NotaDashboard[];
  tomadores: Record<string, { nome: string; subTrib: boolean }>;
  aliquotaEfetiva: number;
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const GestorAiTabela: React.FC<Props> = ({ notas, tomadores, aliquotaEfetiva }) => {
  const { linhas, totais } = useMemo(() => {
    const notasOrdenadas = [...notas].sort((a, b) => {
      const aDate = new Date(a.data_emissao).getTime();
      const bDate = new Date(b.data_emissao).getTime();
      if (Number.isNaN(aDate) && Number.isNaN(bDate)) return 0;
      if (Number.isNaN(aDate)) return 1;
      if (Number.isNaN(bDate)) return -1;
      return aDate - bDate;
    });

    const totalGeral = notasOrdenadas.reduce((acc, nota) => acc + nota.valor_servico, 0);

    const rows = notasOrdenadas.map((nota) => {
      const data = new Date(nota.data_emissao);
      const dataFmt = Number.isNaN(data.getTime())
        ? '—'
        : `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`;
      const tomador = tomadores[nota.tomador_id || ''];
      const nome = tomador?.nome || nota.tomador_nome || 'Sem tomador';
      const valorServico = nota.valor_servico;
      const issRetido = nota.iss_retido ? nota.iss_valor : 0;
      const aliquotaIss = nota.iss_retido ? nota.aliquota : 0;
      const valorSimples = valorServico * aliquotaEfetiva;
      const dasAPagar = Math.max(valorSimples - issRetido, 0);
      const percentual = totalGeral > 0 ? (valorServico / totalGeral) * 100 : 0;

      return {
        id: nota.id,
        dataEmissao: dataFmt,
        nome,
        valorServico,
        issRetido,
        aliquotaIss,
        valorSimples,
        dasAPagar,
        percentual,
      };
    });

    const sums = rows.reduce(
      (acc, row) => ({
        valorServico: acc.valorServico + row.valorServico,
        issRetido: acc.issRetido + row.issRetido,
        valorSimples: acc.valorSimples + row.valorSimples,
        dasAPagar: acc.dasAPagar + row.dasAPagar,
        percentual: acc.percentual + row.percentual,
      }),
      { valorServico: 0, issRetido: 0, valorSimples: 0, dasAPagar: 0, percentual: 0 },
    );

    return { linhas: rows, totais: sums };
  }, [aliquotaEfetiva, notas, tomadores]);

  if (linhas.length === 0) {
    return (
      <div className="section-card flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Users className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm">Nenhuma nota fiscal emitida ainda.</p>
      </div>
    );
  }

  return (
    <div className="section-card overflow-hidden">
      <Table className="table-fixed w-full">
        <colgroup>
          <col className="w-[7%]" />
          <col className="w-[22%]" />
          <col className="w-[15%]" />
          <col className="w-[14%]" />
          <col className="w-[13%]" />
          <col className="w-[13%]" />
          <col className="w-[9%]" />
          <col className="w-[7%]" />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Data</TableHead>
            <TableHead className="text-left">Tomador(a)</TableHead>
            <TableHead className="text-right">Receita R$</TableHead>
            <TableHead className="text-right">ISSQN (R)</TableHead>
            <TableHead className="text-right">AliqSn%</TableHead>
            <TableHead className="text-right">DASN</TableHead>
            <TableHead className="text-right">% Fat.</TableHead>
            <TableHead className="text-center" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-left text-sm tabular-nums">{row.dataEmissao}</TableCell>
              <TableCell className="text-left truncate">
                <div className="font-medium text-foreground text-sm truncate">{row.nome}</div>
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                <span className="inline-flex justify-end w-full">
                  <span className="text-muted-foreground mr-1">R$</span>
                  <span className="inline-block min-w-[5.5rem] text-right">{fmt(row.valorServico)}</span>
                </span>
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                <span className="inline-flex flex-col items-end">
                  {row.aliquotaIss > 0 && (
                    <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 leading-none mb-0.5">
                      {fmt(row.aliquotaIss)}%
                    </span>
                  )}
                  <span>R$ {fmt(row.issRetido)}</span>
                </span>
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                <span className="inline-flex flex-col items-end">
                  <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 leading-none mb-0.5">
                    {fmt(aliquotaEfetiva * 100)}%
                  </span>
                  <span>R$ {fmt(row.valorSimples)}</span>
                </span>
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums font-medium">R$ {fmt(row.dasAPagar)}</TableCell>
              <TableCell className="text-right text-sm tabular-nums">{fmt(row.percentual)}%</TableCell>
              <TableCell className="text-center">
                <button
                  type="button"
                  disabled
                  title="Ação de exclusão será habilitada em breve"
                  className="p-1 rounded text-muted-foreground/50 cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="font-bold">
            <TableCell className="text-left" colSpan={2}>Total</TableCell>
            <TableCell className="text-right tabular-nums">
              <span className="inline-flex justify-end w-full">
                <span className="text-muted-foreground mr-1">R$</span>
                <span className="inline-block min-w-[5.5rem] text-right">{fmt(totais.valorServico)}</span>
              </span>
            </TableCell>
            <TableCell className="text-right tabular-nums">R$ {fmt(totais.issRetido)}</TableCell>
            <TableCell className="text-right tabular-nums">R$ {fmt(totais.valorSimples)}</TableCell>
            <TableCell className="text-right tabular-nums">R$ {fmt(totais.dasAPagar)}</TableCell>
            <TableCell className="text-right tabular-nums">{fmt(totais.percentual)}%</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default GestorAiTabela;
