import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nfseApi } from '@/services/api';
import StatusBadge from '@/components/StatusBadge';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Download, RefreshCw, FileText, AlertTriangle, Eye, ExternalLink, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { getNfseCodigoServico, getNfseDescricao, getNfseTomadorDocumento, getNfseTomadorNome, getNfseValor } from '@/lib/nfse';
import { getProviderDisplayName, inferNfseDataFromProvider, isLegacyProvider } from '@/lib/nfse-provider';
import { formatCNPJ } from '@/utils/validators';
import { useAuth } from '@/contexts/AuthContext';
import { isReadOnlyRole } from '@/lib/roles';

const ACTIVE_NFSE_STATUSES = new Set(['PENDING', 'PROCESSING']);
const NFSE_DETAIL_REFETCH_INTERVAL_MS = 15000;

const openBlobInNewTab = (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

const first = (value: unknown): Record<string, unknown> | null => {
  if (Array.isArray(value)) {
    const item = value[0];
    return item && typeof item === 'object' ? (item as Record<string, unknown>) : null;
  }
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
};

type ParsedErrorItem = {
  code?: string;
  message: string;
};

const parseEmbeddedProviderErrors = (message: string): ParsedErrorItem[] => {
  const start = message.indexOf('[{');
  const end = message.lastIndexOf('}]');
  if (start < 0 || end < start) return [];

  const jsonSlice = message.slice(start, end + 2);
  try {
    const parsed = JSON.parse(jsonSlice) as Array<Record<string, unknown>>;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        code: typeof item.Codigo === 'string' ? item.Codigo : undefined,
        message: typeof item.Descricao === 'string' ? item.Descricao : '',
      }))
      .filter((item) => item.message.trim().length > 0);
  } catch {
    return [];
  }
};

const parseProviderErrors = (raw: unknown): ParsedErrorItem[] => {
  const root = first(raw);
  if (!root) return [];

  const retorno = first(root.retorno);
  const errors: ParsedErrorItem[] = [];

  const mensagemRetorno = retorno?.mensagemRetorno;
  if (typeof mensagemRetorno === 'string' && mensagemRetorno.trim()) {
    errors.push({ message: mensagemRetorno.trim() });
    errors.push(...parseEmbeddedProviderErrors(mensagemRetorno));
  }

  const retornoCodigo = retorno?.Codigo ?? retorno?.codigo;
  const retornoDescricao = retorno?.Descricao ?? retorno?.descricao;
  if (typeof retornoDescricao === 'string' && retornoDescricao.trim()) {
    errors.push({
      code: typeof retornoCodigo === 'string' ? retornoCodigo : undefined,
      message: retornoDescricao.trim(),
    });
  }

  const unique = new Map<string, ParsedErrorItem>();
  errors.forEach((item) => {
    const key = `${item.code || ''}::${item.message}`;
    if (!unique.has(key)) unique.set(key, item);
  });
  return Array.from(unique.values());
};

const readFromRawProvider = (raw: unknown) => {
  const root = first(raw);
  if (!root) return {};

  const retorno = first(root.retorno);
  const tomador = first(root.tomador);
  const servico = first(root.servico);
  const valorObj = first(servico?.valor);

  const numero = (retorno?.numeroNfse ?? root.numeroNfse) as string | number | undefined;
  const tomadorNome = tomador?.razaoSocial as string | undefined;
  const tomadorDoc = tomador?.cpfCnpj as string | undefined;
  const descricao = servico?.discriminacao as string | undefined;
  const codigo = servico?.codigo as string | undefined;
  const valorRaw = valorObj?.servico as string | number | undefined;
  const valor = typeof valorRaw === 'number' ? valorRaw : (typeof valorRaw === 'string' ? Number(valorRaw) : undefined);

  return {
    numeroNfse: typeof numero === 'number' ? String(numero) : numero,
    tomadorRazaoSocial: tomadorNome,
    tomadorCpfCnpj: tomadorDoc,
    descricao,
    codigoServico: codigo,
    valor: Number.isFinite(valor as number) ? valor : undefined,
  };
};

const formatParametroIssAplicado = (value?: string | null) => {
  if (!value) return '—';

  const map: Record<string, string> = {
    iss_outro_municipio: 'Anexo III - ISS devido a outro(s) Municipio(s)',
    iss_proprio_municipio: 'Anexo III - ISS devido ao proprio Municipio',
    iss_retencao_substituicao: 'Anexo III - Com retencao/substituicao tributaria de ISS',
  };

  return map[value] || value;
};

const NfseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isReadOnly = isReadOnlyRole(user?.role || 'user');

  const shouldRefetchActiveEmission = (status?: string) =>
    Boolean(status && ACTIVE_NFSE_STATUSES.has(status));

  const { data: nfse, isLoading, isError, refetch } = useQuery({
    queryKey: ['nfse', id],
    queryFn: () => nfseApi.getById(id!),
    enabled: !!id,
    refetchInterval: (query) =>
      shouldRefetchActiveEmission((query.state.data as { status?: string } | undefined)?.status)
        ? NFSE_DETAIL_REFETCH_INTERVAL_MS
        : false,
    refetchIntervalInBackground: true,
  });

  const { data: artifacts, refetch: refetchArtifacts } = useQuery({
    queryKey: ['nfse-artifacts', id],
    queryFn: () => nfseApi.artifacts(id!),
    enabled: !!id,
    refetchInterval: shouldRefetchActiveEmission(nfse?.status)
      ? NFSE_DETAIL_REFETCH_INTERVAL_MS
      : false,
    refetchIntervalInBackground: true,
  });

  const { data: providerResp, isLoading: isProviderLoading, isError: isProviderError } = useQuery({
    queryKey: ['nfse-provider', id],
    queryFn: () => nfseApi.providerResponse(id!),
    enabled: !!id,
    refetchInterval: shouldRefetchActiveEmission(nfse?.status)
      ? NFSE_DETAIL_REFETCH_INTERVAL_MS
      : false,
    refetchIntervalInBackground: true,
  });

  const syncMutation = useMutation({
    mutationFn: () => nfseApi.syncArtifacts(id!),
    onSuccess: (result) => {
      toast({ title: 'Sincronização de arquivos', description: result.synced ? 'Arquivos sincronizados com sucesso.' : `Nenhuma alteração (${result.reason}).` });
      refetchArtifacts();
    },
  });

  const reemitMutation = useMutation({
    mutationFn: () => nfseApi.reemitir(id!),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['nfse'] });
      toast({
        title: 'Nova tentativa criada',
        description: `A emissao foi reenviada com seguranca. Nova emissao: ${result.emissionId}.`,
      });
      navigate(`/nfse/${result.emissionId}`);
    },
  });

  const downloadFile = async (fn: () => Promise<Blob>, filename: string) => {
    try {
      const blob = await fn();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      // handled by interceptor
    }
  };

  const openPdfPreview = async () => {
    try {
      const blob = await nfseApi.downloadPdf(id!);
      openBlobInNewTab(blob);
    } catch {
      if (nfse?.provider?.trim().toUpperCase() === 'PLUGNOTAS') {
        return;
      }
      try {
        const blob = await nfseApi.downloadRemotePdf(id!);
        openBlobInNewTab(blob);
      } catch {
        // handled by interceptor
      }
    }
  };

  if (isLoading) return <LoadingState />;
  if (isError || !nfse) return <ErrorState onRetry={() => refetch()} />;
  const inferred = inferNfseDataFromProvider(providerResp);
  const rawInferred = readFromRawProvider(providerResp?.raw);
  const providerErrors = parseProviderErrors(providerResp?.raw);
  const errorItems: ParsedErrorItem[] = [];
  if (nfse.errorMessage) {
    errorItems.push({ code: nfse.errorCode || undefined, message: nfse.errorMessage });
  } else if (nfse.errorCode) {
    errorItems.push({ code: nfse.errorCode, message: '' });
  }
  providerErrors.forEach((item) => {
    if (!item.message.trim()) return;
    const exists = errorItems.some(
      (existing) => existing.code === item.code && existing.message === item.message,
    );
    if (!exists) errorItems.push(item);
  });

  const numeroNfse = nfse.numero || rawInferred.numeroNfse || inferred.numeroNfse;
  const descricao = getNfseDescricao(nfse) !== '—' ? getNfseDescricao(nfse) : rawInferred.descricao || inferred.descricao || '—';
  const valor = getNfseValor(nfse) > 0 ? getNfseValor(nfse) : rawInferred.valor || inferred.valor || 0;
  const codigoServico = getNfseCodigoServico(nfse) !== '—' ? getNfseCodigoServico(nfse) : rawInferred.codigoServico || inferred.codigoServico || '—';
  const tomador = getNfseTomadorNome(nfse) !== '—' ? getNfseTomadorNome(nfse) : rawInferred.tomadorRazaoSocial || inferred.tomadorRazaoSocial || '—';
  const tomadorDocRaw = getNfseTomadorDocumento(nfse) !== '—' ? getNfseTomadorDocumento(nfse) : rawInferred.tomadorCpfCnpj || inferred.tomadorCpfCnpj || '—';
  const tomadorDocDigits = tomadorDocRaw.replace(/\D/g, '');
  const tomadorDoc = tomadorDocDigits.length === 14 ? formatCNPJ(tomadorDocDigits) : tomadorDocRaw;
  const canRetryPreTransmission =
    !isReadOnly &&
    nfse.status === 'ERROR' &&
    !nfse.externalId &&
    Boolean(providerResp) &&
    providerResp?.externalId == null &&
    providerResp?.providerResponse == null;

  const isPlugNotasProvider = isLegacyProvider(nfse.provider);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/nfse')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              NFSe {numeroNfse ? `#${numeroNfse}` : nfse.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-muted-foreground">
              Criada em {format(new Date(nfse.createdAt), 'dd/MM/yyyy HH:mm:ss')}
            </p>
          </div>
          <StatusBadge status={nfse.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Button
            className="h-11 rounded-md px-4"
            onClick={openPdfPreview}
          >
            <Eye className="mr-2 h-4 w-4" />
            Visualizar PDF
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-md px-4"
            onClick={() => downloadFile(() => nfseApi.downloadXml(id!), `nfse-${id}.xml`)}
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar XML
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-md px-4"
            onClick={() => downloadFile(() => nfseApi.downloadPdf(id!), `nfse-${id}.pdf`)}
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
          <Button
            variant="ghost"
            className="h-11 rounded-md border border-border px-4 hover:bg-muted"
            onClick={() => window.open(window.location.href, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Nova aba
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 min-w-0">
        {/* Dados */}
        <Card className="min-w-0">
          <CardHeader><CardTitle className="text-sm">Dados da Emissão</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm overflow-hidden">
            <Row label="Descrição" value={descricao} />
            <Row label="Valor" value={valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
            <Row label="Alíquota ISS" value={nfse.aliquotaIss ? `${nfse.aliquotaIss}%` : '—'} />
            <Row label="Valor ISS" value={nfse.valorIss?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '—'} />
            <Row label="Parâmetro Tributário" value={formatParametroIssAplicado(nfse.parametroIssAplicado)} />
            <Row label="Cód. Serviço" value={codigoServico} />
            <Row label="Provedor" value={getProviderDisplayName(nfse.provider)} />
            <Row label="Tomador" value={tomador} />
            <Row label="CPF/CNPJ Tomador" value={tomadorDoc} />
          </CardContent>
        </Card>

        {/* Erro */}
        {(nfse.status === 'ERROR' || nfse.status === 'REJECTED') && (
          <Card className="border-destructive/30 min-w-0">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" /> Erro
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {errorItems.length > 0 ? (
                <div className="space-y-3">
                  {errorItems.map((item, index) => (
                    <div key={`${item.code || 'msg'}-${index}`} className="space-y-1">
                      {item.code && <Badge variant="outline" className="font-mono">{item.code}</Badge>}
                      <p className="text-muted-foreground break-words whitespace-pre-wrap">
                        {item.message || 'Erro sem descrição.'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Sem detalhes de erro.</p>
              )}
              {canRetryPreTransmission ? (
                <div className="border-t border-destructive/20 pt-3">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={reemitMutation.isPending}
                      >
                        <RotateCcw className={`mr-2 h-4 w-4 ${reemitMutation.isPending ? 'animate-spin' : ''}`} />
                        Tentar emitir novamente
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar nova tentativa de emissao?</AlertDialogTitle>
                        <AlertDialogDescription>
                          A tentativa anterior falhou antes da transmissao e sera preservada para auditoria. Uma nova emissao sera criada com os mesmos dados fiscais.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => reemitMutation.mutate()}>
                          Confirmar e emitir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Resposta do Provedor */}
        {providerResp && (
          <Card className="min-w-0">
            <CardHeader><CardTitle className="text-sm">Resposta do Provedor</CardTitle></CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-60 scrollbar-thin whitespace-pre-wrap break-words">
                {JSON.stringify(providerResp.raw, null, 2)}
              </pre>
              {providerResp.receivedAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  Recebida em {format(new Date(providerResp.receivedAt), 'dd/MM/yyyy HH:mm:ss')}
                </p>
              )}
            </CardContent>
          </Card>
        )}
        {!providerResp && (
          <Card className="min-w-0">
            <CardHeader><CardTitle className="text-sm">Resposta do Provedor</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {isProviderLoading ? 'Carregando dados fiscais completos...' : null}
              {isProviderError ? 'Não foi possível carregar a resposta do provedor para esta emissão.' : null}
              {!isProviderLoading && !isProviderError ? 'Sem resposta do provedor disponível para esta emissão.' : null}
            </CardContent>
          </Card>
        )}

        {/* Arquivos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Arquivos</CardTitle>
            {!isReadOnly ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending || isPlugNotasProvider}
                title={
                  isPlugNotasProvider
                    ? 'Sincronização desabilitada para notas históricas PlugNotas'
                    : undefined
                }
              >
                <RefreshCw className={`mr-2 h-3.5 w-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                Sincronizar
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile(() => nfseApi.downloadRemoteXml(id!), `nfse-${id}-remote.xml`)}
                disabled={isPlugNotasProvider}
                title={
                  isPlugNotasProvider
                    ? 'Download remoto desabilitado para notas históricas PlugNotas'
                    : undefined
                }
              >
                <Download className="mr-2 h-3.5 w-3.5" /> XML Remoto
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile(() => nfseApi.downloadRemotePdf(id!), `nfse-${id}-remote.pdf`)}
                disabled={isPlugNotasProvider}
                title={
                  isPlugNotasProvider
                    ? 'Download remoto desabilitado para notas históricas PlugNotas'
                    : undefined
                }
              >
                <Download className="mr-2 h-3.5 w-3.5" /> PDF Remoto
              </Button>
            </div>

            {artifacts && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  <span>XML</span>
                  <Badge variant="outline" className="text-[10px]">{artifacts.hasXml ? 'DISPONÍVEL' : 'AUSENTE'}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  <span>PDF</span>
                  <Badge variant="outline" className="text-[10px]">{artifacts.hasPdf ? 'DISPONÍVEL' : 'AUSENTE'}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string | undefined }) => (
  <div className="grid grid-cols-1 sm:grid-cols-[140px_minmax(0,1fr)] items-start gap-1 sm:gap-3">
    <span className="text-muted-foreground text-xs sm:text-sm">{label}</span>
    <span className="font-medium text-left break-words whitespace-pre-wrap overflow-hidden min-w-0">{value || '—'}</span>
  </div>
);

export default NfseDetailPage;
