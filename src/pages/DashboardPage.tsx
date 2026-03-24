import { useQuery } from '@tanstack/react-query';
import Dashboard from '@/components/Dashboard';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { empresasApi } from '@/services/api';

const DashboardPage = () => {
  const empresasQuery = useQuery({
    queryKey: ['empresas', 'dashboard-header'],
    queryFn: () => empresasApi.list({ limit: 1 }),
    staleTime: 60_000,
  });

  const empresa = (empresasQuery.data || [])[0];

  if (empresasQuery.isLoading) return <LoadingState />;
  if (empresasQuery.isError && !empresa) return <ErrorState onRetry={() => empresasQuery.refetch()} />;

  return (
    <Dashboard
      prestadorId={empresa?.id || null}
      nomeEmpresa={empresa?.razaoSocial || 'Dashboard Financeiro'}
      rbt12={typeof empresa?.rbt12 === 'number' && empresa.rbt12 > 0 ? empresa.rbt12 : 180000}
      cnaeAnexo="III"
      regime={typeof empresa?.regimeTributario === 'string' ? empresa.regimeTributario : null}
      configOperacionais={empresa?.configOperacionais || []}
    />
  );
};

export default DashboardPage;
