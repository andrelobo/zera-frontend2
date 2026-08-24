import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EmptyState from '@/components/EmptyState';
import type { NotaDashboard } from '@/hooks/useDashboardData';

interface Props {
  notas: NotaDashboard[];
  tomadores: Record<string, { nome: string; subTrib: boolean }>;
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

const GestorAiTabela: React.FC<Props> = ({ notas, tomadores }) => {
  const { linhas, totais } = useMemo(() => {
    const totalGeral = notas.reduce((acc, nota) => acc + nota.valor_servico, 0);
    const grouped = new Map<string, {
      id: string;
      nome: string;
      notas: Array<{ id: string; valor: number; data: string }>;
      totalEmitido: number;
      ultimaEmissao: string;
    }>();

    notas.forEach((nota) => {
      const tomadorKey = nota.tomador_id || nota.tomador_nome || 'sem-tomador';
      const tomador = tomadores[nota.tomador_id || ''];
      const nome = tomador?.nome || nota.tomador_nome || 'Sem tomador';

      if (!grouped.has(tomadorKey)) {
        grouped.set(tomadorKey, {
          id: tomadorKey,
          nome,
          notas: [],
          totalEmitido: 0,
          ultimaEmissao: nota.data_emissao,
        });
      }

      const entry = grouped.get(tomadorKey)!;
      entry.notas.push({
        id: nota.id,
        valor: nota.valor_servico,
        data: nota.data_emissao,
      });
      entry.totalEmitido += nota.valor_servico;

      const currentLast = new Date(entry.ultimaEmissao).getTime();
      const candidate = new Date(nota.data_emissao).getTime();
      if (Number.isNaN(currentLast) || candidate > currentLast) {
        entry.ultimaEmissao = nota.data_emissao;
      }
    });

    const rows = Array.from(grouped.values())
      .map((entry) => ({
        ...entry,
        notas: [...entry.notas].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
        quantidadeNotas: entry.notas.length,
        percentual: totalGeral > 0 ? (entry.totalEmitido / totalGeral) * 100 : 0,
        ticketMedio: entry.notas.length > 0 ? entry.totalEmitido / entry.notas.length : 0,
      }))
      .sort((a, b) => b.totalEmitido - a.totalEmitido);

    let quantidadeNotas = 0;
    let totalEmitido = 0;
    let percentual = 0;
    let somaTicketMedio = 0;

    rows.forEach((item) => {
      quantidadeNotas += item.quantidadeNotas;
      totalEmitido += item.totalEmitido;
      percentual += item.percentual;
      somaTicketMedio += item.ticketMedio;
    });

    const sums = {
      quantidadeNotas,
      totalEmitido,
      percentual,
      ticketMedio: rows.length > 0 ? somaTicketMedio / rows.length : 0,
    };

    return { linhas: rows, totais: sums };
  }, [notas, tomadores]);

  if (linhas.length === 0) {
    return <EmptyState title="Ainda não há dados para análise" message="As leituras por tomador aparecerão depois que a operação fiscal registrar emissões." />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
      <Table className="table-fixed w-full">
        <colgroup>
          <col className="w-[24%]" />
          <col className="w-[12%]" />
          <col className="w-[29%]" />
          <col className="w-[15%]" />
          <col className="w-[12%]" />
          <col className="w-[8%]" />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Tomador(a)</TableHead>
            <TableHead className="text-right">Qtd. notas</TableHead>
            <TableHead className="text-left">Valores das notas</TableHead>
            <TableHead className="text-right">Total emitido</TableHead>
            <TableHead className="text-right">Ticket médio</TableHead>
            <TableHead className="text-right">% faturamento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((row) => (
            <TableRow key={row.id} className="transition-colors hover:bg-muted/40">
              <TableCell className="text-left">
                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground text-sm">{row.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    Última emissão: {formatDate(row.ultimaEmissao)}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">{row.quantidadeNotas}</TableCell>
              <TableCell className="text-left">
                <div className="flex flex-wrap gap-1.5">
                  {row.notas.slice(0, 4).map((nota) => (
                    <span
                      key={nota.id}
                      className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-foreground"
                      title={`Emitida em ${formatDate(nota.data)}`}
                    >
                      R$ {fmt(nota.valor)}
                    </span>
                  ))}
                  {row.notas.length > 4 && (
                    <span className="inline-flex items-center rounded-full border border-dashed border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                      +{row.notas.length - 4} notas
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums font-medium">R$ {fmt(row.totalEmitido)}</TableCell>
              <TableCell className="text-right text-sm tabular-nums">R$ {fmt(row.ticketMedio)}</TableCell>
              <TableCell className="text-right text-sm tabular-nums">{fmt(row.percentual)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="font-bold">
            <TableCell className="text-left">Total</TableCell>
            <TableCell className="text-right tabular-nums">{totais.quantidadeNotas}</TableCell>
            <TableCell />
            <TableCell className="text-right tabular-nums">R$ {fmt(totais.totalEmitido)}</TableCell>
            <TableCell className="text-right tabular-nums">R$ {fmt(totais.ticketMedio)}</TableCell>
            <TableCell className="text-right tabular-nums">{fmt(totais.percentual)}%</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default GestorAiTabela;
