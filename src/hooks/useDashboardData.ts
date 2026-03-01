import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
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

const parseProviderValor = (raw: unknown): number => {
  const root = Array.isArray(raw) ? raw[0] : raw;
  if (!root || typeof root !== 'object') return 0;
  const rootObj = root as Record<string, unknown>;
  const servicoRaw = rootObj.servico;
  const servico = Array.isArray(servicoRaw) ? servicoRaw[0] : servicoRaw;
  if (!servico || typeof servico !== 'object') return 0;
  const servicoObj = servico as Record<string, unknown>;
  const valorRaw = servicoObj.valor;
  if (!valorRaw || typeof valorRaw !== 'object') return 0;
  const valorObj = valorRaw as Record<string, unknown>;
  const valorServico = valorObj.servico;
  if (typeof valorServico === 'number' && Number.isFinite(valorServico)) return valorServico;
  if (typeof valorServico === 'string') {
    const parsed = Number(valorServico);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const parseProviderIssValor = (raw: unknown): number => {
  const root = Array.isArray(raw) ? raw[0] : raw;
  if (!root || typeof root !== 'object') return 0;
  const rootObj = root as Record<string, unknown>;
  const servicoRaw = rootObj.servico;
  const servico = Array.isArray(servicoRaw) ? servicoRaw[0] : servicoRaw;
  if (!servico || typeof servico !== 'object') return 0;
  const servicoObj = servico as Record<string, unknown>;
  const valorRaw = servicoObj.valor;
  if (!valorRaw || typeof valorRaw !== 'object') return 0;
  const valorObj = valorRaw as Record<string, unknown>;
  const iss = valorObj.iss;
  if (typeof iss === 'number' && Number.isFinite(iss)) return iss;
  if (typeof iss === 'string') {
    const parsed = Number(iss);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export function useDashboardData(prestadorId: string | null, rbt12: number, cnaeAnexo: string) {
  const nfseQuery = useQuery({
    queryKey: ['nfse-dashboard-v2', prestadorId],
    queryFn: () => nfseApi.list({ page: 1, limit: 1000 }),
    staleTime: 60_000,
  });

  const baseItems = nfseQuery.data?.data || [];

  const itemsToEnrich = useMemo(() => (
    baseItems.filter((item) => item.status === 'AUTHORIZED' && getNfseValor(item) <= 0)
  ), [baseItems]);

  const providerQueries = useQueries({
    queries: itemsToEnrich.map((item) => ({
      queryKey: ['nfse-dashboard-provider-v2', item.id, item.updatedAt],
      queryFn: () => nfseApi.providerResponse(item.id),
      staleTime: 5 * 60 * 1000,
      retry: 0,
      enabled: Boolean(item.id),
    })),
  });

  const providerMap = useMemo(() => {
    const map = new Map<string, { valor: number; iss: number }>();
    itemsToEnrich.forEach((item, index) => {
      const q = providerQueries[index];
      if (!q || !q.data) return;
      map.set(item.id, {
        valor: parseProviderValor(q.data.raw),
        iss: parseProviderIssValor(q.data.raw),
      });
    });
    return map;
  }, [itemsToEnrich, providerQueries]);

  const notas = useMemo<NotaDashboard[]>(() => {
    return baseItems.map((item) => {
      const fallback = providerMap.get(item.id);
      const valorServico = getNfseValor(item) > 0 ? getNfseValor(item) : (fallback?.valor ?? 0);
      const issValor = typeof item.valorIss === 'number' ? item.valorIss : (fallback?.iss ?? 0);
      const baseCalculo = Math.max(0, valorServico);
      const aliquota = valorServico > 0 ? ((issValor / valorServico) * 100) : 0;
      const tomadorNome = item.tomadorRazaoSocial || item.tomador?.razaoSocial || 'Cliente sem nome';
      const tomadorDoc = item.tomadorCnpjCpf || item.tomador?.cpfCnpj || '';

      return {
        id: item.id,
        tomador_id: tomadorDoc || tomadorNome,
        tomador_nome: tomadorNome,
        valor_servico: valorServico,
        desconto: 0,
        base_calculo: baseCalculo,
        iss_valor: issValor,
        iss_retido: false,
        valor_liquido: Math.max(0, valorServico - issValor),
        ret_pis: 0,
        ret_cofins: 0,
        ret_csll: 0,
        ret_ir: 0,
        ret_inss: 0,
        aliquota,
        data_emissao: item.createdAt,
        status: item.status,
      };
    });
  }, [baseItems, providerMap]);

  const splits = useMemo<SplitPaymentRow[]>(() => [], []);

  const calculo = useMemo(() => calcularSimplesAnexoIII(rbt12, cnaeAnexo || 'III'), [rbt12, cnaeAnexo]);

  const dadosMensais = useMemo<MesData[]>(() => {
    const map = new Map<string, MesData>();
    notas.forEach((n) => {
      const d = new Date(n.data_emissao);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      if (!map.has(key)) {
        map.set(key, { mes: key, label, faturamento: 0, tributoEstimado: 0, issRetido: 0, qtdNotas: 0 });
      }
      const m = map.get(key)!;
      m.faturamento += n.valor_servico;
      m.tributoEstimado += n.valor_servico * (calculo.aliquotaEfetiva || 0);
      m.issRetido += n.iss_retido ? n.iss_valor : 0;
      m.qtdNotas += 1;
    });
    return Array.from(map.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [notas, calculo.aliquotaEfetiva]);

  const kpis = useMemo(() => {
    const now = new Date();
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const notasMesAtual = notas.filter((n) => {
      const d = new Date(n.data_emissao);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === mesAtual;
    });
    const mesesComNotas = Array.from(
      new Set(
        notas.map((n) => {
          const d = new Date(n.data_emissao);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }),
      ),
    ).sort();
    const mesReferencia = notasMesAtual.length > 0 ? mesAtual : (mesesComNotas[mesesComNotas.length - 1] ?? mesAtual);
    const notasMes = mesReferencia === mesAtual
      ? notasMesAtual
      : notas.filter((n) => {
          const d = new Date(n.data_emissao);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === mesReferencia;
        });
    const [anoRef, mesRef] = mesReferencia.split('-');
    const mesReferenciaLabel = `${mesRef}/${anoRef}`;

    const faturamentoMes = notasMes.reduce((s, n) => s + n.valor_servico, 0);
    const totalNotas = notas.length;
    const totalNotasMes = notasMes.length;
    const issRetidoMes = notasMes.filter((n) => n.iss_retido).reduce((s, n) => s + n.iss_valor, 0);
    const dasEstimado = faturamentoMes * (calculo.aliquotaEfetiva || 0);
    const totalRetencoes = notasMes.reduce((s, n) => s + n.ret_pis + n.ret_cofins + n.ret_csll + n.ret_ir + n.ret_inss, 0);
    const valorLiquidoMes = notasMes.reduce((s, n) => s + n.valor_liquido, 0);
    const totalReservado = 0;
    const margemLiquida = faturamentoMes > 0 ? ((valorLiquidoMes - dasEstimado) / faturamentoMes) * 100 : 0;

    return {
      faturamentoMes,
      mesReferencia,
      mesReferenciaLabel,
      rbt12,
      totalNotas,
      totalNotasMes,
      dasEstimado,
      issRetidoMes,
      valorLiquidoMes,
      totalReservado,
      aliquotaEfetiva: calculo.aliquotaEfetiva,
      margemLiquida,
      totalRetencoes,
    };
  }, [notas, calculo, rbt12]);

  const analiseClientes = useMemo<ClienteAnalise[]>(() => {
    const map = new Map<string, { faturamento: number; qtd: number; nome: string }>();
    notas.forEach((n) => {
      const tid = n.tomador_id || 'sem-tomador';
      if (!map.has(tid)) {
        map.set(tid, { faturamento: 0, qtd: 0, nome: n.tomador_nome || 'Cliente sem nome' });
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
    const tributario = kpis.dasEstimado + kpis.issRetidoMes;
    return { operacional, tributario, saldo: operacional - tributario };
  }, [kpis]);

  const loading = nfseQuery.isLoading || providerQueries.some((q) => q.isLoading || q.isFetching);

  return { loading, notas, splits, kpis, calculo, dadosMensais, analiseClientes, alertas, fluxoCaixa };
}
