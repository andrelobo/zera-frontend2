import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserRound } from 'lucide-react';
import { tomadoresApi } from '@/services/api';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import TomadoresLista, { type TomadorListaItem } from '@/components/TomadoresLista';
import { toast } from '@/hooks/use-toast';
import useDebouncedTruthy from '@/hooks/useDebouncedTruthy';
import { useAuth } from '@/contexts/AuthContext';
import { isReadOnlyRole } from '@/lib/roles';

const formatDoc = (value?: string) => {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.length === 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  if (digits.length === 14) {
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return value || '';
};

const TomadoresPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isReadOnly = isReadOnlyRole(user?.role || 'user');

  const { data: tomadores = [], isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['tomadores'],
    queryFn: () => tomadoresApi.list(),
  });
  const shouldShowError = useDebouncedTruthy(Boolean(isError && !isFetching && tomadores.length === 0), 400);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tomadoresApi.delete(id),
    onSuccess: () => {
      toast({ title: 'Tomador removido' });
      queryClient.invalidateQueries({ queryKey: ['tomadores'] });
    },
  });

  const items: TomadorListaItem[] = useMemo(
    () => tomadores.map((tomador) => ({
      id: tomador.id,
      cpfCnpj: formatDoc(tomador.cpfCnpj),
      razaoSocial: tomador.razaoSocial,
      localidadeUf: tomador.endereco?.municipio && tomador.endereco?.uf
        ? `${tomador.endereco.municipio} - ${tomador.endereco.uf}`
        : undefined,
      email: tomador.email,
      substitutoTributario: tomador.cpfCnpj.replace(/\D/g, '').length === 11
        ? false
        : Boolean(tomador.substitutoTributario),
    })),
    [tomadores],
  );

  if (isLoading) return <LoadingState />;
  if (shouldShowError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserRound className="w-5 h-5" />
          Tomadores
        </h1>
      </div>

      <TomadoresLista
        tomadores={items}
        loading={isLoading}
        onNovo={!isReadOnly ? () => navigate('/tomadores/novo') : undefined}
        onEditar={!isReadOnly ? (tomador) => navigate(`/tomadores/${tomador.id}`) : undefined}
        onExcluir={!isReadOnly ? (id) => deleteMutation.mutate(id) : undefined}
        editingId={null}
      />
    </div>
  );
};

export default TomadoresPage;
