import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Dashboard from '@/components/Dashboard';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { empresasApi, nfseApi } from '@/services/api';

const DASHBOARD_MIN_EMISSAO_DATE = new Date(2026, 1, 11, 0, 0, 0, 0); // 11/02/2026

const DashboardPage = () => {
  const empresasQuery = useQuery({
    queryKey: ['empresas', 'dashboard-header'],
    queryFn: () => empresasApi.list({ limit: 1 }),
    staleTime: 60_000,
  });

  const nfseQuery = useQuery({
    queryKey: ['nfse', 'dashboard-rbt12'],
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

  if (empresasQuery.isLoading && nfseQuery.isLoading) return <LoadingState />;
  if (empresasQuery.isError && !empresa) return <ErrorState onRetry={() => empresasQuery.refetch()} />;

  return (
    <Dashboard
      prestadorId={empresa?.id || null}
      nomeEmpresa={empresa?.razaoSocial || 'Dashboard Financeiro'}
      rbt12={rbt12 > 0 ? rbt12 : 180000}
      cnaeAnexo="III"
      regime={typeof empresa?.regimeTributario === 'string' ? empresa.regimeTributario : null}
      configOperacionais={empresa?.configOperacionais || []}
    />
  );
};

export default DashboardPage;
