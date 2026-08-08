import { useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { nfseApi } from '@/services/api';
import StatusBadge from '@/components/StatusBadge';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Zap, Eye, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import type { NfseStatus, NfseProvider } from '@/types/api';
import { getNfsePrestadorDocumento, getNfsePrestadorNome, getNfseTomadorDocumento, getNfseTomadorNome, getNfseValor } from '@/lib/nfse';
import { getProviderDisplayName, inferNfseDataFromProvider, isLegacyProvider } from '@/lib/nfse-provider';
import useDebouncedTruthy from '@/hooks/useDebouncedTruthy';
import { useAuth } from '@/contexts/AuthContext';
import { isReadOnlyRole } from '@/lib/roles';

const ACTIVE_NFSE_STATUSES = new Set(['PENDING', 'PROCESSING']);
const NFSE_LIST_REFETCH_INTERVAL_MS = 15000;
const NFSE_LIST_LIMIT = 10;

const openBlobInNewTab = (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

const NfseListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isReadOnly = isReadOnlyRole(user?.role || 'user');

  const page = 1;
  const limit = NFSE_LIST_LIMIT;
  const status = (searchParams.get('status') as NfseStatus) || undefined;
  const provider = (searchParams.get('provider') as NfseProvider) || undefined;

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['nfse', page, status, provider],
    queryFn: () => nfseApi.list({
      page,
      limit,
      status,
      provider,
      sort: 'createdAt',
      order: 'DESC',
    }),
    refetchInterval: (query) => {
      const rows = (query.state.data as { data?: Array<{ status?: string }> } | undefined)?.data ?? [];
      const hasActiveEmission = rows.some((item) => item.status && ACTIVE_NFSE_STATUSES.has(item.status));
      return hasActiveEmission ? NFSE_LIST_REFETCH_INTERVAL_MS : false;
    },
    refetchIntervalInBackground: true,
  });
  const shouldShowError = useDebouncedTruthy(Boolean(isError && !isFetching && !data), 400);

  const items = data?.data || [];
  const providerDetails = useQueries({
    queries: items.map((nfse) => ({
      queryKey: ['nfse-provider-list', nfse.id],
      queryFn: () => nfseApi.providerResponse(nfse.id),
      staleTime: 60_000,
      retry: 0,
    })),
  });

  const inferredById = Object.fromEntries(
    items.map((nfse, idx) => [nfse.id, inferNfseDataFromProvider(providerDetails[idx]?.data)]),
  );

  const getPrestadorLabel = (nfse: (typeof items)[number]) => {
    const nome = getNfsePrestadorNome(nfse);
    if (nome !== '—') return nome;
    return (
      inferredById[nfse.id]?.prestadorRazaoSocial ||
      inferredById[nfse.id]?.prestadorCpfCnpj ||
      getNfsePrestadorDocumento(nfse)
    );
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const isPlugNotasProvider = isLegacyProvider;

  const handleOpenPdf = async (
    event: React.MouseEvent,
    nfseId: string,
    provider?: string,
  ) => {
    event.stopPropagation();
    try {
      const blob = await nfseApi.downloadPdf(nfseId);
      openBlobInNewTab(blob);
    } catch {
      if (isPlugNotasProvider(provider)) {
        return;
      }
      try {
        const blob = await nfseApi.downloadRemotePdf(nfseId);
        openBlobInNewTab(blob);
      } catch {
        // handled by interceptor
      }
    }
  };

  const handleDownloadPdf = async (
    event: React.MouseEvent,
    nfseId: string,
    provider?: string,
  ) => {
    event.stopPropagation();
    try {
      const blob = await nfseApi.downloadPdf(nfseId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nfse-${nfseId}.pdf`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      if (isPlugNotasProvider(provider)) {
        return;
      }
      try {
        const blob = await nfseApi.downloadRemotePdf(nfseId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nfse-${nfseId}-remote.pdf`;
        a.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } catch {
        // handled by interceptor
      }
    }
  };

  if (isLoading) return <LoadingState />;
  if (shouldShowError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Operação fiscal</h1>
          <p className="text-sm text-muted-foreground">Emissão, acompanhamento e consulta dos documentos fiscais.</p>
        </div>
        <div className="flex gap-2">
          {!isReadOnly ? (
            <>
              <Button variant="outline" size="lg" onClick={() => navigate('/nfse/rapida')}>
                <Zap className="mr-2 h-4 w-4" /> Emissão rápida
              </Button>
              <Button size="lg" onClick={() => navigate('/nfse/nova')}>
                <Plus className="mr-2 h-4 w-4" /> Nova NFS-e
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-lg border bg-card p-3 shadow-sm" aria-label="Filtros da operação fiscal">
        <Select value={status || 'all'} onValueChange={v => updateFilter('status', v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="PENDING">Processando</SelectItem>
            <SelectItem value="AUTHORIZED">Autorizada</SelectItem>
            <SelectItem value="REJECTED">Rejeitada</SelectItem>
            <SelectItem value="ERROR">Erro</SelectItem>
            <SelectItem value="CANCELED">Cancelada</SelectItem>
          </SelectContent>
        </Select>

        <Select value={provider || 'all'} onValueChange={v => updateFilter('provider', v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Provedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os ambientes</SelectItem>
            <SelectItem value="LOBONOTAS">Ambiente Nacional</SelectItem>
            <SelectItem value="PLUGNOTAS">Legado (PlugNotas)</SelectItem>
            <SelectItem value="MANAUS">Manaus</SelectItem>
            <SelectItem value="MOCK">Ambiente de teste</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <EmptyState message="Nenhuma NFSe encontrada com os filtros atuais." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prestadora</TableHead>
                  <TableHead>Tomador</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Provedor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(nfse => (
                  <TableRow
                    key={nfse.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => navigate(`/nfse/${nfse.id}`)}
                  >
                    <TableCell className="font-medium">{nfse.numero || inferredById[nfse.id]?.numeroNfse || '—'}</TableCell>
                    <TableCell><StatusBadge status={nfse.status} /></TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {getPrestadorLabel(nfse)}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {getNfseTomadorNome(nfse) !== '—'
                        ? getNfseTomadorNome(nfse)
                        : (inferredById[nfse.id]?.tomadorRazaoSocial || inferredById[nfse.id]?.tomadorCpfCnpj || getNfseTomadorDocumento(nfse))}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {(getNfseValor(nfse) > 0 ? getNfseValor(nfse) : (inferredById[nfse.id]?.valor || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{getProviderDisplayName(nfse.provider)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(nfse.createdAt), 'dd/MM/yy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 rounded-md border border-border bg-card text-foreground shadow-sm hover:bg-muted"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/nfse/${nfse.id}`);
                          }}
                          title="Detalhes da DANFSE"
                          aria-label="Abrir detalhes da DANFSE"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 rounded-md border border-border bg-card text-foreground shadow-sm hover:bg-muted"
                          onClick={(event) => handleOpenPdf(event, nfse.id, nfse.provider)}
                          title="Visualizar PDF"
                          aria-label="Visualizar PDF"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 rounded-md border border-border bg-card text-foreground shadow-sm hover:bg-muted"
                          onClick={(event) => handleDownloadPdf(event, nfse.id, nfse.provider)}
                          title="Baixar PDF"
                          aria-label="Baixar PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Mostrando as últimas {NFSE_LIST_LIMIT} emissões mais recentes no quadro.
            </span>
            <span className="text-sm text-muted-foreground">
              Histórico preservado: {data?.total || 0} registro(s).
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default NfseListPage;
