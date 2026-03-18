import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import GestorAiTabela from '@/components/dashboard/GestorAiTabela';
import { useDashboardData } from '@/hooks/useDashboardData';
import { empresasApi, nfseApi } from '@/services/api';
import { getNfseValor } from '@/lib/nfse';

const DASHBOARD_MIN_EMISSAO_DATE = new Date(2026, 1, 11, 0, 0, 0, 0); // 11/02/2026

const GestorAiPage = () => {
  const empresasQuery = useQuery({
    queryKey: ['empresas', 'gestor-ai-header'],
    queryFn: () => empresasApi.list({ limit: 1 }),
    staleTime: 60_000,
  });

  const nfseQuery = useQuery({
    queryKey: ['nfse', 'gestor-ai-rbt12'],
    queryFn: () => nfseApi.list({ page: 1, limit: 1000 }),
    staleTime: 60_000,
  });

  const empresa = (empresasQuery.data || [])[0];

  const rbt12 = useMemo(() => {
    const items = nfseQuery.data?.data || [];
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    const cutoffDate = oneYearAgo > DASHBOARD_MIN_EMISSAO_DATE ? oneYearAgo : DASHBOARD_MIN_EMISSAO_DATE;

    return items
      .filter((item) => new Date(item.createdAt) >= cutoffDate)
      .reduce((sum, item) => sum + getNfseValor(item), 0);
  }, [nfseQuery.data]);

  const { loading, notas, tomadores, kpis } = useDashboardData(
    empresa?.id || null,
    rbt12 > 0 ? rbt12 : 180000,
    'III',
  );

  if ((empresasQuery.isLoading && nfseQuery.isLoading) || loading) return <LoadingState />;
  if (empresasQuery.isError && !empresa) return <ErrorState onRetry={() => empresasQuery.refetch()} />;

  return (
    <div className="space-y-4">
      <GestorAiTabela
        notas={notas}
        tomadores={tomadores}
      />
    </div>
  );
};

export default GestorAiPage;
