import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Search, Trash2, UserRound } from 'lucide-react';
import { empresasApi, tomadoresApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import { toast } from '@/hooks/use-toast';

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
  const [empresaSearch, setEmpresaSearch] = useState('');
  const [q, setQ] = useState('');
  const [selectedEmpresaCnpj, setSelectedEmpresaCnpj] = useState('');

  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas', 'tomadores-filter'],
    queryFn: () => empresasApi.list({ q: empresaSearch, limit: 20 }),
  });

  const empresaOptions = useMemo(() => {
    if (!empresaSearch.trim()) return empresas.slice(0, 10);
    const term = empresaSearch.toLowerCase();
    const digits = empresaSearch.replace(/\D/g, '');
    return empresas
      .filter((empresa) =>
        empresa.razaoSocial.toLowerCase().includes(term)
        || (empresa.nomeFantasia || '').toLowerCase().includes(term)
        || empresa.cnpj.replace(/\D/g, '').includes(digits))
      .slice(0, 10);
  }, [empresaSearch, empresas]);

  const { data: tomadores = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['tomadores', selectedEmpresaCnpj, q],
    queryFn: () => tomadoresApi.list({ empresaCnpj: selectedEmpresaCnpj || undefined, q: q || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tomadoresApi.delete(id),
    onSuccess: () => {
      toast({ title: 'Tomador removido' });
      queryClient.invalidateQueries({ queryKey: ['tomadores'] });
    },
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserRound className="w-5 h-5" />
          Tomadores
        </h1>
        <Button onClick={() => navigate('/tomadores/novo')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Tomador
        </Button>
      </div>

      <div className="section-card">
        <h2 className="section-title">
          <span className="section-title-icon section-title-icon-primary">
            <Building2 className="w-4 h-4" />
          </span>
          <span>Filtros</span>
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="field-label">Empresa (autocomplete backend)</Label>
            <Input
              className="field-input"
              value={empresaSearch}
              onChange={(e) => setEmpresaSearch(e.target.value)}
              placeholder="Digite razão social ou CNPJ"
            />
            {empresaOptions.length > 0 && (
              <div className="max-h-44 overflow-auto rounded-md border p-1">
                {empresaOptions.map((empresa) => (
                  <button
                    key={empresa.id}
                    type="button"
                    className="w-full rounded px-2 py-1 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      setSelectedEmpresaCnpj(empresa.cnpj);
                      setEmpresaSearch(`${empresa.razaoSocial} (${empresa.cnpj})`);
                    }}
                  >
                    <span className="font-medium">{empresa.razaoSocial}</span> ({empresa.cnpj})
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="field-label">Buscar tomador</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="field-input pl-8"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nome ou CPF/CNPJ"
              />
            </div>
          </div>
        </div>
      </div>

      {tomadores.length === 0 ? (
        <EmptyState message="Nenhum tomador encontrado para os filtros atuais." />
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razão Social</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tomadores.map((tomador) => (
                <TableRow key={tomador.id} className="hover:bg-muted/50">
                  <TableCell>{tomador.razaoSocial}</TableCell>
                  <TableCell>{formatDoc(tomador.cpfCnpj)}</TableCell>
                  <TableCell>{formatDoc(tomador.empresaCnpj)}</TableCell>
                  <TableCell>{tomador.email || '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/tomadores/${tomador.id}`)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(tomador.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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

export default TomadoresPage;
