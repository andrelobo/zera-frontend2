import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { nfseApi } from '@/services/api';
import { getNfseValor } from '@/lib/nfse';
import { calcularSimplesAnexoIII } from '@/utils/simples-nacional';

export interface NotaDashboard {
  id: string;
  tomador_id: string | null;
  valor_servico: number;
  desconto: number;
  base_calculo: number;
  iss_valor: number;
  iss_retido: boolean;
  valor_liquido: number;
  ret_pis: number;
  ret_cofins: number;
  ret_csll: number;
  ret_ir: number;
  ret_inss: number;
  aliquota: number;
  data_emissao: string;
  status: string;
  tomador_nome: string;
}

export interface SplitPaymentRow {
  id: string;
  nota_fiscal_id: string;
  valor_bruto: number;
  valor_reservado: number;
  valor_liberado: number;
  status: string;
  mes_referencia: string;
}

export interface ClienteAnalise {
  tomadorId: string;
  nome: string;
  faturamento: number;
  quantidadeNf: number;
  ticketMedio: number;
  percentual: number;
  classificacao: 'A' | 'B' | 'C';
}

export interface MesData {
  mes: string;
  label: string;
  faturamento: number;
  tributoEstimado: number;
  issRetido: number;
  qtdNotas: number;
}

function monthLabelFromCompetencia(competencia: string): string {
  const cleaned = (competencia || '').trim();
  if (/^\d{2}\/\d{4}$/.test(cleaned)) return cleaned;
  if (/^\d{4}-\d{2}$/.test(cleaned)) return `${cleaned.slice(5, 7)}/${cleaned.slice(0, 4)}`;
  if (cleaned === 'SEM_COMPETENCIA') return 'Sem comp.';
  return cleaned || 'Sem comp.';
}

function competenciaOrderValue(competencia: string): number {
  const cleaned = (competencia || '').trim();
  if (/^\d{4}-\d{2}$/.test(cleaned)) {
    const [year, month] = cleaned.split('-');
    return Number(year) * 100 + Number(month);
  }
  if (/^\d{2}\/\d{4}$/.test(cleaned)) {
    const [month, year] = cleaned.split('/');
    return Number(year) * 100 + Number(month);
  }
  return -1;
}

function normalizeCompetenciaToYearMonth(competencia: string): string {
  const cleaned = (competencia || '').trim();
  if (/^\d{4}-\d{2}$/.test(cleaned)) return cleaned;
  if (/^\d{2}\/\d{4}$/.test(cleaned)) {
    const [month, year] = cleaned.split('/');
    return `${year}-${month}`;
  }
  return '';
}

function resolveTomadorNome(
  item: {
    tomadorRazaoSocial?: string;
    tomador?: { razaoSocial?: string };
  },
): string {
  const nome = (item.tomadorRazaoSocial || item.tomador?.razaoSocial || '').trim();
  return nome || 'Emissão expressa';
}

export function useDashboardData(prestadorId: string | null, rbt12: number, cnaeAnexo: string) {
  const now = useMemo(() => new Date(), []);
  const oneYearAgo = useMemo(() => {
    const date = new Date(now);
    date.setFullYear(now.getFullYear() - 1);
    return date;
  }, [now]);
  const dateFrom = oneYearAgo.toISOString().slice(0, 10);
  const dateTo = now.toISOString().slice(0, 10);

  const biQuery = useQuery({
    queryKey: ['nfse-dashboard-bi-summary-v1', prestadorId, dateFrom, dateTo],
    queryFn: () => nfseApi.biSummary({ dateFrom, dateTo }),
    staleTime: 60_000,
  });

  const nfseQuery = useQuery({
    queryKey: ['nfse-dashboard-list-v3', prestadorId, dateFrom, dateTo],
    // Dashboard usa dataset bruto para evitar perder notas legadas com competencia/dataEmissao nulas.
    queryFn: () => nfseApi.list({ page: 1, limit: 1000 }),
    staleTime: 60_000,
  });

  const notas = useMemo<NotaDashboard[]>(() => {
    const baseItems = (nfseQuery.data?.data || []).filter((item) => {
      const provider = (item.provider || '').toString().trim().toUpperCase();
      return provider === 'PLUGNOTAS';
    });
    return baseItems.map((item) => {
      const valorServico = typeof item.valorServico === 'number' ? item.valorServico : getNfseValor(item);
      const desconto = typeof item.desconto === 'number' ? item.desconto : 0;
      const baseCalculo = typeof item.baseCalculo === 'number'
        ? item.baseCalculo
        : Math.max(0, valorServico - desconto);
      const issValor = typeof item.valorIss === 'number' ? item.valorIss : 0;
      const aliquota = baseCalculo > 0 ? ((issValor / baseCalculo) * 100) : 0;
      const tomadorNome = resolveTomadorNome(item);
      const tomadorDoc = item.tomadorCnpjCpf || item.tomador?.cpfCnpj || '';

      return {
        id: item.id,
        tomador_id: tomadorDoc || tomadorNome,
        tomador_nome: tomadorNome,
        valor_servico: valorServico,
        desconto,
        base_calculo: baseCalculo,
        iss_valor: issValor,
        iss_retido: issValor > 0 && aliquota <= 0,
        valor_liquido: Math.max(
          0,
          valorServico -
            issValor -
            (item.retPis || 0) -
            (item.retCofins || 0) -
            (item.retCsll || 0) -
            (item.retIr || 0) -
            (item.retInss || 0),
        ),
        ret_pis: typeof item.retPis === 'number' ? item.retPis : 0,
        ret_cofins: typeof item.retCofins === 'number' ? item.retCofins : 0,
        ret_csll: typeof item.retCsll === 'number' ? item.retCsll : 0,
        ret_ir: typeof item.retIr === 'number' ? item.retIr : 0,
        ret_inss: typeof item.retInss === 'number' ? item.retInss : 0,
        aliquota,
        data_emissao: item.dataEmissao || item.createdAt,
        status: item.status,
      };
    });
  }, [nfseQuery.data?.data]);

  const splits = useMemo<SplitPaymentRow[]>(() => [], []);

  const calculo = useMemo(() => calcularSimplesAnexoIII(rbt12, cnaeAnexo || 'III'), [rbt12, cnaeAnexo]);

  const dadosMensais = useMemo<MesData[]>(() => {
    const series = biQuery.data?.seriesCompetencia || [];
    return series.map((item) => ({
      mes: normalizeCompetenciaToYearMonth(item.competencia) || item.competencia,
      label: monthLabelFromCompetencia(item.competencia),
      faturamento: item.valorServico || 0,
      tributoEstimado: (item.valorServico || 0) * (calculo.aliquotaEfetiva || 0),
      issRetido: item.valorIss || 0,
      qtdNotas: item.quantidade || 0,
    }));
  }, [biQuery.data?.seriesCompetencia, calculo.aliquotaEfetiva]);

  const kpis = useMemo(() => {
    const totals = biQuery.data?.totals;
    const retencoes = biQuery.data?.retencoes;
    const serie = biQuery.data?.seriesCompetencia || [];
    const latest = [...serie].sort((a, b) => competenciaOrderValue(a.competencia) - competenciaOrderValue(b.competencia)).at(-1);
    const notasOrdenadasPorData = [...notas].sort((a, b) => (a.data_emissao || '').localeCompare(b.data_emissao || ''));
    const ultimaNota = notasOrdenadasPorData[notasOrdenadasPorData.length - 1];
    const competenciaFallback = (() => {
      if (!ultimaNota?.data_emissao) return '';
      const d = new Date(ultimaNota.data_emissao);
      if (Number.isNaN(d.getTime())) return '';
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();
    const notasMesFallback = competenciaFallback
      ? notas.filter((item) => {
          const d = new Date(item.data_emissao);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          return key === competenciaFallback;
        })
      : [];

    const faturamentoMes = latest?.valorServico ?? notasMesFallback.reduce((acc, item) => acc + item.valor_servico, 0);
    const totalNotasMes = latest?.quantidade ?? notasMesFallback.length;
    const mesReferenciaRaw = latest?.competencia || competenciaFallback || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const mesReferencia = normalizeCompetenciaToYearMonth(mesReferenciaRaw) || competenciaFallback || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const mesReferenciaLabel = monthLabelFromCompetencia(mesReferencia);
    const issRetidoMes = latest?.valorIss ?? notasMesFallback.reduce((acc, item) => acc + item.iss_valor, 0);
    const dasEstimado = faturamentoMes * (calculo.aliquotaEfetiva || 0);
    const dasAPagar = Math.max(dasEstimado - issRetidoMes, 0);
    const totalRetencoes = totals?.somaRetencoes
      ?? ((retencoes?.pis || 0) + (retencoes?.cofins || 0) + (retencoes?.csll || 0) + (retencoes?.ir || 0) + (retencoes?.inss || 0));
    const valorLiquidoMes = Math.max(0, faturamentoMes - dasAPagar - totalRetencoes);
    const totalReservado = 0;
    const margemLiquida = faturamentoMes > 0 ? ((valorLiquidoMes - dasEstimado) / faturamentoMes) * 100 : 0;

    return {
      faturamentoMes,
      mesReferencia,
      mesCompetencia: mesReferencia,
      mesReferenciaLabel,
      competenciaLabel: mesReferenciaLabel,
      rbt12,
      totalNotas: totals?.totalEmissoes ?? notas.length,
      totalNotasMes,
      dasEstimado,
      dasAPagar,
      issRetidoMes,
      valorLiquidoMes,
      totalReservado,
      aliquotaEfetiva: calculo.aliquotaEfetiva,
      margemLiquida,
      totalRetencoes,
    };
  }, [biQuery.data, calculo.aliquotaEfetiva, now, notas, rbt12]);

  const analiseClientes = useMemo<ClienteAnalise[]>(() => {
    const map = new Map<string, { faturamento: number; qtd: number; nome: string }>();
    notas.forEach((n) => {
      const tid = n.tomador_id || 'sem-tomador';
      if (!map.has(tid)) {
        map.set(tid, { faturamento: 0, qtd: 0, nome: n.tomador_nome || 'Emissão expressa' });
      }
      const c = map.get(tid)!;
      c.faturamento += n.valor_servico;
      c.qtd += 1;
    });
    const totalFat = Array.from(map.values()).reduce((s, c) => s + c.faturamento, 0);
    const sorted = Array.from(map.entries())
      .map(([tid, c]) => ({
        tomadorId: tid,
        nome: c.nome,
        faturamento: c.faturamento,
        quantidadeNf: c.qtd,
        ticketMedio: c.qtd > 0 ? c.faturamento / c.qtd : 0,
        percentual: totalFat > 0 ? (c.faturamento / totalFat) * 100 : 0,
        classificacao: 'C' as 'A' | 'B' | 'C',
      }))
      .sort((a, b) => b.faturamento - a.faturamento);

    let acum = 0;
    sorted.forEach((c) => {
      acum += c.percentual;
      if (acum <= 80) c.classificacao = 'A';
      else if (acum <= 95) c.classificacao = 'B';
      else c.classificacao = 'C';
    });

    return sorted;
  }, [notas]);

  const tomadores = useMemo<Record<string, { nome: string; subTrib: boolean }>>(() => {
    const map: Record<string, { nome: string; subTrib: boolean }> = {};
    notas.forEach((nota) => {
      const key = nota.tomador_id || '';
      if (!key) return;
      if (!map[key]) {
        map[key] = {
          nome: nota.tomador_nome || 'Emissão expressa',
          subTrib: false,
        };
      }
    });
    return map;
  }, [notas]);

  const alertas = useMemo(() => {
    const list: { tipo: 'warning' | 'danger' | 'info'; mensagem: string }[] = [];
    if (kpis.margemLiquida < 20 && kpis.faturamentoMes > 0) {
      list.push({ tipo: 'danger', mensagem: `Margem líquida de ${kpis.margemLiquida.toFixed(1)}% está abaixo de 20%.` });
    }
    const clienteConcentrado = analiseClientes.find((c) => c.percentual > 40);
    if (clienteConcentrado) {
      list.push({ tipo: 'warning', mensagem: `${clienteConcentrado.nome} concentra ${clienteConcentrado.percentual.toFixed(1)}% da receita.` });
    }
    return list;
  }, [kpis, analiseClientes]);

  const fluxoCaixa = useMemo(() => {
    const operacional = kpis.valorLiquidoMes;
    const tributario = kpis.dasAPagar + kpis.issRetidoMes;
    return { operacional, tributario, saldo: operacional - tributario };
  }, [kpis]);

  const loading = biQuery.isLoading || nfseQuery.isLoading;

  return { loading, notas, splits, tomadores, kpis, calculo, dadosMensais, analiseClientes, alertas, fluxoCaixa };
}
