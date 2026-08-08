import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { empresasApi } from '@/services/api';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isReadOnlyRole } from '@/lib/roles';
import { toast } from '@/hooks/use-toast';
import useDebouncedTruthy from '@/hooks/useDebouncedTruthy';
import { formatCNPJ } from '@/utils/validators';

const EmpresasPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isReadOnly = isReadOnlyRole(user?.role || 'user');

  const { data: empresas, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => empresasApi.list(),
  });
  const shouldShowError = useDebouncedTruthy(Boolean(isError && !isFetching && !empresas), 400);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => empresasApi.delete(id),
    onSuccess: () => {
      toast({ title: 'Empresa excluída' });
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });

  if (isLoading) return <LoadingState />;
  if (shouldShowError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Empresas</h1>
          <p className="text-sm text-muted-foreground">Cadastros, parâmetros e prontidão operacional das prestadoras.</p>
        </div>
        <div className="flex gap-2">
          {!isReadOnly ? (
            <Button size="lg" onClick={() => navigate('/empresas/nova')}>
              <Plus className="mr-2 h-4 w-4" /> Nova empresa
            </Button>
          ) : null}
        </div>
      </div>

      {!empresas?.length ? (
        <EmptyState message="Nenhuma empresa cadastrada." action={!isReadOnly ? <Button onClick={() => navigate('/empresas/nova')}>Cadastrar empresa</Button> : undefined} />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razão Social</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.map(e => (
                <TableRow key={e.id} className="transition-colors hover:bg-muted/40">
                  <TableCell className="font-medium">{e.razaoSocial}</TableCell>
                  <TableCell className="font-mono text-sm">{formatCNPJ(e.cnpj || '')}</TableCell>
                  <TableCell>{(e.cidade || e.endereco?.cidade || e.endereco?.descricaoCidade) ? `${e.cidade || e.endereco?.cidade || e.endereco?.descricaoCidade}/${e.uf || e.endereco?.uf || e.endereco?.estado || '—'}` : '—'}</TableCell>
                  <TableCell>{e.email || '—'}</TableCell>
                  <TableCell>
                    {!isReadOnly ? (
                      <div className="flex gap-1">
                        <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => navigate(`/empresas/${e.id}`)} aria-label={`Editar empresa ${e.razaoSocial}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="h-11 w-11 border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15" aria-label={`Excluir empresa ${e.razaoSocial}`}><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
                              <AlertDialogDescription>Esta ação não pode ser desfeita. A empresa "{e.razaoSocial}" será removida.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate(e.id)}>Excluir empresa</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default EmpresasPage;
