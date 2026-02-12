import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nfseApi } from '@/services/api';
import StatusBadge from '@/components/StatusBadge';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, RefreshCw, FileText, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const NfseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: nfse, isLoading, isError, refetch } = useQuery({
    queryKey: ['nfse', id],
    queryFn: () => nfseApi.getById(id!),
    enabled: !!id,
  });

  const { data: artifacts, refetch: refetchArtifacts } = useQuery({
    queryKey: ['nfse-artifacts', id],
    queryFn: () => nfseApi.artifacts(id!),
    enabled: !!id,
  });

  const { data: providerResp } = useQuery({
    queryKey: ['nfse-provider', id],
    queryFn: () => nfseApi.providerResponse(id!),
    enabled: !!id,
  });

  const syncMutation = useMutation({
    mutationFn: () => nfseApi.syncArtifacts(id!),
    onSuccess: () => {
      toast({ title: 'Sincronização iniciada', description: 'Artifacts serão atualizados em breve.' });
      refetchArtifacts();
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
      URL.revokeObjectURL(url);
    } catch {
      // handled by interceptor
    }
  };

  if (isLoading) return <LoadingState />;
  if (isError || !nfse) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/nfse')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            NFSe {nfse.numero ? `#${nfse.numero}` : nfse.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Criada em {format(new Date(nfse.createdAt), 'dd/MM/yyyy HH:mm:ss')}
          </p>
        </div>
        <StatusBadge status={nfse.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Dados */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Dados da Emissão</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Descrição" value={nfse.descricaoServico} />
            <Row label="Valor" value={nfse.valorServico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
            <Row label="Alíquota ISS" value={nfse.aliquotaIss ? `${nfse.aliquotaIss}%` : '—'} />
            <Row label="Valor ISS" value={nfse.valorIss?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '—'} />
            <Row label="Cód. Serviço" value={nfse.codigoServico || '—'} />
            <Row label="Provider" value={nfse.provider} />
            <Row label="Tomador" value={nfse.tomadorRazaoSocial || '—'} />
            <Row label="CPF/CNPJ Tomador" value={nfse.tomadorCnpjCpf || '—'} />
          </CardContent>
        </Card>

        {/* Erro */}
        {(nfse.status === 'ERROR' || nfse.status === 'REJECTED') && (
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" /> Erro
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {nfse.errorCode && <Badge variant="outline" className="font-mono">{nfse.errorCode}</Badge>}
              <p className="text-muted-foreground">{nfse.errorMessage || 'Sem detalhes de erro.'}</p>
            </CardContent>
          </Card>
        )}

        {/* Provider Response */}
        {providerResp && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Resposta do Provider</CardTitle></CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-60 scrollbar-thin">
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

        {/* Artifacts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Artifacts</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Quick download buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadFile(() => nfseApi.downloadXml(id!), `nfse-${id}.xml`)}>
                <Download className="mr-2 h-3.5 w-3.5" /> XML Local
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadFile(() => nfseApi.downloadPdf(id!), `nfse-${id}.pdf`)}>
                <Download className="mr-2 h-3.5 w-3.5" /> PDF Local
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadFile(() => nfseApi.downloadRemoteXml(id!), `nfse-${id}-remote.xml`)}>
                <Download className="mr-2 h-3.5 w-3.5" /> XML Remoto
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadFile(() => nfseApi.downloadRemotePdf(id!), `nfse-${id}-remote.pdf`)}>
                <Download className="mr-2 h-3.5 w-3.5" /> PDF Remoto
              </Button>
            </div>

            {/* Artifact list */}
            {artifacts && artifacts.length > 0 && (
              <div className="mt-3 space-y-1">
                {artifacts.map(a => (
                  <div key={a.id} className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{a.filename}</span>
                    <Badge variant="outline" className="text-[10px]">{a.type}</Badge>
                    <Badge variant="outline" className="text-[10px]">{a.source}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-right">{value}</span>
  </div>
);

export default NfseDetailPage;
