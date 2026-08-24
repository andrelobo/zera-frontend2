import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Network } from 'lucide-react';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import GestorAiTabela from '@/components/dashboard/GestorAiTabela';
import { useDashboardData } from '@/hooks/useDashboardData';
import { empresasApi, nfseApi } from '@/services/api';

const DASHBOARD_MIN_EMISSAO_DATE = new Date(2026, 1, 11, 0, 0, 0, 0); // 11/02/2026

const GestorAiPage = () => {
  const empresasQuery = useQuery({
    queryKey: ['empresas', 'gestor-ai-header'],
    queryFn: () => empresasApi.list({ limit: 1 }),
    staleTime: 60_000,
  });

  const nfseQuery = useQuery({
    queryKey: ['nfse', 'gestor-ai-rbt12'],
    queryFn: () => {
      const now = new Date();
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      const cutoffDate = oneYearAgo > DASHBOARD_MIN_EMISSAO_DATE ? oneYearAgo : DASHBOARD_MIN_EMISSAO_DATE;

      return nfseApi.biSummary({
        dateFrom: cutoffDate.toISOString().slice(0, 10),
        dateTo: now.toISOString().slice(0, 10),
      });
    },
    staleTime: 60_000,
  });

  const empresa = (empresasQuery.data || [])[0];

  const rbt12 = useMemo(() => {
    return nfseQuery.data?.totals?.somaValorServico || 0;
  }, [nfseQuery.data]);

  const { loading, notas, tomadores, kpis } = useDashboardData(
    empresa?.id || null,
    rbt12 > 0 ? rbt12 : 180000,
    'III',
  );

  if ((empresasQuery.isLoading && nfseQuery.isLoading) || loading) return <LoadingState />;
  if (empresasQuery.isError && !empresa) return <ErrorState onRetry={() => empresasQuery.refetch()} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <Network className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Inteligência operacional</p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
              Jupati Insights
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Visão consolidada por tomador para apoiar análises fiscais e comerciais com decisão supervisionada.
            </p>
          </div>
        </div>
      </div>

      <GestorAiTabela
        notas={notas}
        tomadores={tomadores}
      />
    </div>
  );
};

export default GestorAiPage;
