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
import { Plus, ChevronLeft, ChevronRight, Zap, Eye, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import type { NfseStatus, NfseProvider } from '@/types/api';
import { getNfseTomadorDocumento, getNfseTomadorNome, getNfseValor } from '@/lib/nfse';
import { inferNfseDataFromProvider } from '@/lib/nfse-provider';
import useDebouncedTruthy from '@/hooks/useDebouncedTruthy';

const NFSE_LIST_DATE_FROM = '2026-02-01';
const ACTIVE_NFSE_STATUSES = new Set(['PENDING', 'PROCESSING']);
const NFSE_LIST_REFETCH_INTERVAL_MS = 15000;

const openBlobInNewTab = (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

const NfseListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1');
  const limit = 15;
  const status = (searchParams.get('status') as NfseStatus) || undefined;
  const provider = (searchParams.get('provider') as NfseProvider) || undefined;

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['nfse', page, status, provider],
    queryFn: () => nfseApi.list({
      page,
      limit,
      status,
      provider,
      dateFrom: NFSE_LIST_DATE_FROM,
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
  const totalPages = data?.totalPages || 1;
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

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', p.toString());
    setSearchParams(params);
  };

  const handleOpenPdf = async (event: React.MouseEvent, nfseId: string) => {
    event.stopPropagation();
    try {
      const blob = await nfseApi.downloadPdf(nfseId);
      openBlobInNewTab(blob);
    } catch {
      try {
        const blob = await nfseApi.downloadRemotePdf(nfseId);
        openBlobInNewTab(blob);
      } catch {
        // handled by interceptor
      }
    }
  };

  const handleDownloadPdf = async (event: React.MouseEvent, nfseId: string) => {
    event.stopPropagation();
    try {
      const blob = await nfseApi.downloadPdf(nfseId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nfse-${nfseId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      try {
        const blob = await nfseApi.downloadRemotePdf(nfseId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nfse-${nfseId}-remote.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        // handled by interceptor
      }
    }
  };

  if (isLoading) return <LoadingState />;
  if (shouldShowError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Notas Fiscais</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/nfse/rapida')}>
            <Zap className="mr-2 h-4 w-4" /> Emissão Rápida
          </Button>
          <Button onClick={() => navigate('/nfse/nova')}>
            <Plus className="mr-2 h-4 w-4" /> Nova DANFSE
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={status || 'all'} onValueChange={v => updateFilter('status', v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="PENDING">Processando</SelectItem>
            <SelectItem value="PROCESSING">Processando (legado)</SelectItem>
            <SelectItem value="AUTHORIZED">Autorizada</SelectItem>
            <SelectItem value="REJECTED">Rejeitada</SelectItem>
            <SelectItem value="ERROR">Erro</SelectItem>
            <SelectItem value="CANCELLED">Cancelada</SelectItem>
          </SelectContent>
        </Select>

        <Select value={provider || 'all'} onValueChange={v => updateFilter('provider', v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Provedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Provedores</SelectItem>
            <SelectItem value="PLUGNOTAS">PlugNotas</SelectItem>
            <SelectItem value="MANAUS">Manaus</SelectItem>
            <SelectItem value="MOCK">Mock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <EmptyState message="Nenhuma NFSe encontrada com os filtros atuais." />
      ) : (
        <>
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Status</TableHead>
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
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/nfse/${nfse.id}`)}
                  >
                    <TableCell className="font-medium">{nfse.numero || inferredById[nfse.id]?.numeroNfse || '—'}</TableCell>
                    <TableCell><StatusBadge status={nfse.status} /></TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {getNfseTomadorNome(nfse) !== '—'
                        ? getNfseTomadorNome(nfse)
                        : (inferredById[nfse.id]?.tomadorRazaoSocial || inferredById[nfse.id]?.tomadorCpfCnpj || getNfseTomadorDocumento(nfse))}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {(getNfseValor(nfse) > 0 ? getNfseValor(nfse) : (inferredById[nfse.id]?.valor || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell className="text-xs uppercase text-muted-foreground">{nfse.provider}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(nfse.createdAt), 'dd/MM/yy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full border border-sky-200 bg-sky-50 text-sky-800 shadow-sm hover:border-sky-300 hover:bg-sky-100 hover:text-sky-950"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/nfse/${nfse.id}`);
                          }}
                          title="Detalhes da DANFSE"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full border border-violet-200 bg-violet-50 text-violet-800 shadow-sm hover:border-violet-300 hover:bg-violet-100 hover:text-violet-950"
                          onClick={(event) => handleOpenPdf(event, nfse.id)}
                          title="Visualizar PDF"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full border border-amber-200 bg-amber-50 text-amber-800 shadow-sm hover:border-amber-300 hover:bg-amber-100 hover:text-amber-950"
                          onClick={(event) => handleDownloadPdf(event, nfse.id)}
                          title="Baixar PDF"
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

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages} ({data?.total || 0} registros)
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NfseListPage;
