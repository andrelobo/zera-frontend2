import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { empresasApi, nfseApi } from '@/services/api';
import type { ApiError, EmitirNfseQuickResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Send, ShieldAlert } from 'lucide-react';

const CERT_REQUIRED_CODES = new Set(['CERTIFICADO_REQUIRED', 'QUICK_PRESTADOR_NO_CERT']);
const QUICK_SERVICE_ERROR_CODES = new Set(['INVALID_CODIGO_SERVICO', 'QUICK_CODIGO_SERVICO_INVALIDO']);

const formatCnpj = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

const formatCpf = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
};

const formatCurrencyFromDigits = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const amount = Number(digits) / 100;
  return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const extractServiceCode = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 6) return '';
  return digits.slice(0, 6);
};

const getApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as Partial<ApiError>;
    return {
      code: data.code || 'HTTP_ERROR',
      message: data.message || 'Falha ao emitir NFSe rápida.',
      correlationId: data.correlationId,
      details: data.details,
    };
  }
  return {
    code: 'UNEXPECTED_ERROR',
    message: 'Falha ao emitir NFSe rápida.',
  };
};

const NfseQuickEmitPage = () => {
  const navigate = useNavigate();
  const [empresaSearch, setEmpresaSearch] = useState('');
  const [empresaSearchDebounced, setEmpresaSearchDebounced] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [cpfTomador, setCpfTomador] = useState('');
  const [valorDigits, setValorDigits] = useState<string>('');
  const [codigoServico, setCodigoServico] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceSearchDebounced, setServiceSearchDebounced] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState<EmitirNfseQuickResponse | null>(null);
  const [certRequiredBlock, setCertRequiredBlock] = useState(false);

  const cnpjClean = useMemo(() => cnpj.replace(/\D/g, ''), [cnpj]);
  const cpfClean = useMemo(() => cpfTomador.replace(/\D/g, ''), [cpfTomador]);
  const codigoServicoClean = useMemo(() => codigoServico.replace(/\D/g, ''), [codigoServico]);
  const valorNumber = useMemo(() => Number(valorDigits || '0') / 100, [valorDigits]);
  const valorMasked = useMemo(() => formatCurrencyFromDigits(valorDigits), [valorDigits]);

  useEffect(() => {
    const timer = setTimeout(() => setEmpresaSearchDebounced(empresaSearch), 250);
    return () => clearTimeout(timer);
  }, [empresaSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setServiceSearchDebounced(serviceSearch), 250);
    return () => clearTimeout(timer);
  }, [serviceSearch]);

  const canSearchService = serviceSearchDebounced.trim().length >= 2;
  const canSearchEmpresa = empresaSearchDebounced.trim().length >= 2;
  const { data: filteredEmpresas = [], isLoading: empresasLoading } = useQuery({
    queryKey: ['empresas', 'quick-emit-autocomplete', empresaSearchDebounced],
    queryFn: () => empresasApi.list({ q: empresaSearchDebounced, limit: 8 }),
    enabled: canSearchEmpresa,
    staleTime: 60_000,
  });

  const serviceQuery = useQuery({
    queryKey: ['nfse-quick-service-autocomplete', serviceSearchDebounced],
    queryFn: async () => {
      try {
        return await nfseApi.servicosList(
          { q: serviceSearchDebounced, limit: 8 },
          { skipGlobalErrorToast: true },
        );
      } catch {
        return nfseApi.servicosAutocomplete({ q: serviceSearchDebounced, limit: 8 });
      }
    },
    enabled: canSearchService,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: () => nfseApi.emitirQuick({
      cnpj: cnpjClean,
      cpfTomador: cpfClean,
      valor: valorNumber,
      codigoServico: codigoServicoClean,
    }),
    onSuccess: (data) => {
      setApiError(null);
      setFormError(null);
      setCertRequiredBlock(false);
      setSuccess(data);
    },
    onError: (error) => {
      setSuccess(null);
      const parsed = getApiError(error);
      setApiError(parsed);
      if (CERT_REQUIRED_CODES.has(parsed.code)) {
        setCertRequiredBlock(true);
      }
    },
  });

  const validate = () => {
    if (!cnpjClean) return 'Informe o CNPJ do prestador.';
    if (cnpjClean.length !== 14) return 'CNPJ inválido. Informe 14 dígitos.';
    if (!cpfClean) return 'Informe o CPF do tomador.';
    if (cpfClean.length !== 11) return 'CPF inválido. Informe 11 dígitos.';
    if (!Number.isFinite(valorNumber) || valorNumber <= 0) return 'Informe um valor maior que zero.';
    if (!codigoServicoClean) return 'Selecione um código de serviço.';
    if (codigoServicoClean.length !== 6) return 'Código de serviço inválido. Informe 6 dígitos.';
    return null;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setApiError(null);
    setSuccess(null);

    const validationError = validate();
    setFormError(validationError);
    if (validationError || certRequiredBlock) return;

    mutation.mutate();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/nfse')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Emissão Rápida</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">NFSe com CNPJ, CPF e valor</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="empresaSearch">Empresa (autocomplete)</Label>
              <Input
                id="empresaSearch"
                value={empresaSearch}
                onChange={(e) => setEmpresaSearch(e.target.value)}
                placeholder="Digite razão social ou CNPJ"
              />
              {empresasLoading && (
                <p className="text-sm text-muted-foreground">Carregando empresas...</p>
              )}
              {filteredEmpresas.length > 0 && (
                <div className="max-h-44 overflow-auto rounded-md border p-1">
                  {filteredEmpresas.map((empresa) => (
                    <button
                      key={`quick-empresa-${empresa.id}`}
                      type="button"
                      className="w-full rounded px-2 py-1 text-left text-sm hover:bg-accent"
                      onClick={() => {
                        setCnpj(formatCnpj(empresa.cnpj));
                        setEmpresaSearch(`${empresa.razaoSocial} (${empresa.cnpj})`);
                      }}
                    >
                      <span className="font-medium">{empresa.razaoSocial}</span> ({empresa.cnpj})
                    </button>
                  ))}
                </div>
              )}
              {canSearchEmpresa && !empresasLoading && filteredEmpresas.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma empresa encontrada.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ do prestador (manual, se necessário)</Label>
              <Input
                id="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(formatCnpj(e.target.value))}
                placeholder="00.000.000/0000-00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpfTomador">CPF do tomador</Label>
              <Input
                id="cpfTomador"
                value={cpfTomador}
                onChange={(e) => setCpfTomador(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor</Label>
              <Input
                id="valor"
                inputMode="numeric"
                value={valorMasked}
                onChange={(e) => setValorDigits(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceSearch">Serviço (autocomplete)</Label>
              <Input
                id="serviceSearch"
                value={serviceSearch}
                onChange={(e) => {
                  const next = e.target.value;
                  setServiceSearch(next);
                  setCodigoServico(extractServiceCode(next));
                }}
                placeholder="Digite código ou descrição do serviço"
              />
              {serviceQuery.isLoading && canSearchService && (
                <p className="text-sm text-muted-foreground">Buscando serviços...</p>
              )}
              {serviceQuery.isSuccess && (serviceQuery.data?.items?.length ?? 0) > 0 && (
                <div className="max-h-44 overflow-auto rounded-md border p-1">
                  {(serviceQuery.data?.items ?? []).map((item) => (
                    <button
                      key={`${item.codigoServico}-${item.sequencial ?? ''}`}
                      type="button"
                      className="w-full rounded px-2 py-1 text-left text-sm hover:bg-accent"
                      onClick={() => {
                        setCodigoServico(item.codigoServico);
                        setServiceSearch(`${item.codigoServico} - ${item.descricao}`);
                      }}
                    >
                      <span className="font-medium">{item.codigoServico}</span> - {item.descricao}
                    </button>
                  ))}
                </div>
              )}
              {serviceQuery.isFetched && !serviceQuery.isFetching && canSearchService && (serviceQuery.data?.items?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum serviço encontrado.</p>
              )}
              <p className="text-xs text-muted-foreground">
                {codigoServicoClean.length === 6
                  ? `Código selecionado: ${codigoServicoClean}`
                  : 'Selecione um item da lista ou digite o código com 6 dígitos.'}
              </p>
            </div>

            {formError && (
              <Alert variant="destructive">
                <AlertTitle>Validação</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {apiError && (
              <Alert variant="destructive">
                <AlertTitle>Erro na emissão rápida</AlertTitle>
                <AlertDescription>
                  {QUICK_SERVICE_ERROR_CODES.has(apiError.code) && (
                    <p>Selecione um código de serviço válido no catálogo.</p>
                  )}
                  <p><strong>Código:</strong> {apiError.code}</p>
                  <p><strong>Mensagem:</strong> {apiError.message}</p>
                  {apiError.correlationId && <p><strong>Correlação:</strong> {apiError.correlationId}</p>}
                </AlertDescription>
              </Alert>
            )}

            {certRequiredBlock && (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Certificado obrigatório</AlertTitle>
                <AlertDescription>
                  <p>Importe o certificado digital da empresa para liberar a emissão rápida.</p>
                  <Button type="button" variant="outline" className="mt-2" onClick={() => navigate('/certificado-digital')}>
                    Ir para Certificado Digital
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertTitle>Emissão registrada</AlertTitle>
                <AlertDescription>
                  <p><strong>Emission ID:</strong> {success.emissionId}</p>
                  <p><strong>Status:</strong> {success.result.status}</p>
                  {success.result.status === 'PENDING' && <p>Nota enviada para processamento.</p>}
                  {success.idempotentReplay && <p>Reaproveitada por idempotência.</p>}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={mutation.isPending || certRequiredBlock}>
                {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Emitir NFSe rápida
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NfseQuickEmitPage;
