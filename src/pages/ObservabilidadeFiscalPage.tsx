import { useEffect, useMemo, useState } from 'react';
import { Activity, Clock3, RadioTower, RefreshCcw, Search, ShieldCheck, Waypoints } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole } from '@/lib/roles';
import { nfseApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

type DiagnosticsData = {
  route?: string;
  sharedSecretConfigured?: boolean;
  sharedSecretHeader?: string;
  pollingFallbackEnabled?: boolean;
  artifactSyncOnAuthorizedWebhook?: boolean;
  observabilityCheck?: string;
};

type TimelineItem = {
  at?: string | null;
  type?: string;
  status?: string | null;
  details?: Record<string, unknown> | null;
};

type ObservabilityResponse = {
  externalId?: string | null;
  status?: string | null;
  observability?: {
    poll?: {
      attempts?: number;
      lastPolledAt?: string | null;
      nextPollAt?: string | null;
    };
    webhook?: {
      lastWebhookAt?: string | null;
      lastUpdateSource?: string | null;
    };
    timeline?: TimelineItem[];
    artifactSyncAudit?: Array<Record<string, unknown>>;
  };
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR');
};

const prettyJson = (value: unknown) => JSON.stringify(value, null, 2);

const ObservabilidadeFiscalPage = () => {
  const { user } = useAuth();
  const isAdmin = normalizeRole(user?.role || 'user') === 'admin';
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(true);
  const [externalId, setExternalId] = useState('');
  const [loadingTrace, setLoadingTrace] = useState(false);
  const [trace, setTrace] = useState<ObservabilityResponse | null>(null);
  const [traceError, setTraceError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let alive = true;
    setLoadingDiagnostics(true);
    setDiagnosticsError(null);
    nfseApi
      .webhookDiagnostics()
      .then((data) => {
        if (!alive) return;
        setDiagnostics(data as DiagnosticsData);
      })
      .catch((error) => {
        if (!alive) return;
        setDiagnosticsError(error?.response?.data?.message || 'Não foi possível carregar o diagnóstico do webhook.');
      })
      .finally(() => {
        if (!alive) return;
        setLoadingDiagnostics(false);
      });
    return () => {
      alive = false;
    };
  }, [isAdmin]);

  const timeline = useMemo(() => trace?.observability?.timeline || [], [trace]);

  const handleLookup = async () => {
    const normalized = externalId.trim();
    if (!normalized) return;
    setLoadingTrace(true);
    setTraceError(null);
    try {
      const data = await nfseApi.observabilityByExternalId(normalized);
      setTrace(data as ObservabilityResponse);
    } catch (error) {
      setTrace(null);
      const apiMessage = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setTraceError(apiMessage || 'Não foi possível consultar a observabilidade desta emissão.');
    } finally {
      setLoadingTrace(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Observabilidade Fiscal</h1>
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>Esta área é exclusiva para administradores.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Observabilidade Fiscal</h1>
        <p className="text-sm text-muted-foreground">Rastrear webhook, polling e emissões por `externalId`.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <RadioTower className="h-4 w-4 text-primary" />
            Diagnóstico do Webhook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {diagnosticsError ? (
            <Alert variant="destructive">
              <AlertTitle>Falha no diagnóstico</AlertTitle>
              <AlertDescription>{diagnosticsError}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Rota</p>
              <p className="mt-1 text-sm font-medium">{loadingDiagnostics ? 'Carregando...' : diagnostics?.route || '—'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Segredo</p>
              <p className="mt-1 text-sm font-medium">
                {loadingDiagnostics ? 'Carregando...' : diagnostics?.sharedSecretConfigured ? 'Configurado' : 'Ausente'}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Header</p>
              <p className="mt-1 text-sm font-medium">{loadingDiagnostics ? 'Carregando...' : diagnostics?.sharedSecretHeader || '—'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Polling Fallback</p>
              <p className="mt-1 text-sm font-medium">
                {loadingDiagnostics ? 'Carregando...' : diagnostics?.pollingFallbackEnabled ? 'Ativo' : 'Inativo'}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Sync Autorizado</p>
              <p className="mt-1 text-sm font-medium">
                {loadingDiagnostics ? 'Carregando...' : diagnostics?.artifactSyncOnAuthorizedWebhook ? 'Ativo' : 'Inativo'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Waypoints className="h-4 w-4 text-primary" />
            Rastrear Emissão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              placeholder="Informe o externalId da emissão"
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleLookup();
                }
              }}
            />
            <Button type="button" onClick={() => void handleLookup()} disabled={!externalId.trim() || loadingTrace}>
              {loadingTrace ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Consultar
            </Button>
          </div>

          {traceError ? (
            <Alert variant="destructive">
              <AlertTitle>Falha na consulta</AlertTitle>
              <AlertDescription>{traceError}</AlertDescription>
            </Alert>
          ) : null}

          {trace ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">ExternalId</p>
                  <p className="mt-1 break-all text-sm font-medium">{trace.externalId || '—'}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Status Atual</p>
                  <div className="mt-1">
                    <Badge variant="secondary">{trace.status || '—'}</Badge>
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Última Origem</p>
                  <p className="mt-1 text-sm font-medium">{trace.observability?.webhook?.lastUpdateSource || '—'}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Tentativas de Polling</p>
                  <p className="mt-1 text-sm font-medium">{trace.observability?.poll?.attempts ?? 0}</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Webhook</p>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Último webhook</span>
                      <span>{formatDateTime(trace.observability?.webhook?.lastWebhookAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Origem do último update</span>
                      <span>{trace.observability?.webhook?.lastUpdateSource || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Polling</p>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Tentativas</span>
                      <span>{trace.observability?.poll?.attempts ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Último polling</span>
                      <span>{formatDateTime(trace.observability?.poll?.lastPolledAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Próximo polling</span>
                      <span>{formatDateTime(trace.observability?.poll?.nextPollAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {timeline.length > 0 ? timeline.map((item, index) => (
                      <div key={`${item.type || 'item'}-${index}`} className="rounded-lg border p-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{item.type || 'EVENT'}</Badge>
                            <span className="text-sm font-medium">{item.status || '—'}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDateTime(item.at)}</span>
                        </div>
                        {item.details ? (
                          <pre className="mt-3 overflow-x-auto rounded-md bg-muted/40 p-3 text-xs leading-relaxed">
                            {prettyJson(item.details)}
                          </pre>
                        ) : null}
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground">Nenhum evento de timeline encontrado.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default ObservabilidadeFiscalPage;
