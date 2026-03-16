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
import { toast } from '@/hooks/use-toast';
import useDebouncedTruthy from '@/hooks/useDebouncedTruthy';
import { formatCNPJ } from '@/utils/validators';

const EmpresasPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: empresas, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['empresas'],
    queryFn: empresasApi.list,
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
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/empresas/nova')}>
            <Plus className="mr-2 h-4 w-4" /> Nova Empresa
          </Button>
        </div>
      </div>

      {!empresas?.length ? (
        <EmptyState message="Nenhuma empresa cadastrada." action={<Button onClick={() => navigate('/empresas/nova')}>Cadastrar empresa</Button>} />
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
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
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.razaoSocial}</TableCell>
                  <TableCell className="font-mono text-sm">{formatCNPJ(e.cnpj || '')}</TableCell>
                  <TableCell>{(e.cidade || e.endereco?.cidade || e.endereco?.descricaoCidade) ? `${e.cidade || e.endereco?.cidade || e.endereco?.descricaoCidade}/${e.uf || e.endereco?.uf || e.endereco?.estado || '—'}` : '—'}</TableCell>
                  <TableCell>{e.email || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/empresas/${e.id}`)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita. A empresa "{e.razaoSocial}" será removida.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(e.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
