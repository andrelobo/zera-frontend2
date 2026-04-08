import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { empresasApi, nfseApi } from '@/services/api';
import type { ApiError, EmitirNfseQuickResponse } from '@/types/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Send, ShieldAlert } from 'lucide-react';
import ServicoAutocomplete from '@/components/emissao/ServicoAutocomplete';
import { formatCNPJ } from '@/utils/validators';

const CERT_REQUIRED_CODES = new Set(['CERTIFICADO_REQUIRED', 'QUICK_PRESTADOR_NO_CERT']);
const QUICK_SERVICE_ERROR_CODES = new Set(['INVALID_CODIGO_SERVICO', 'QUICK_CODIGO_SERVICO_INVALIDO']);
const STATUS_PROCESSING_SET = new Set(['PENDING', 'PROCESSING']);

const formatNfseStatus = (status?: string) => {
  if (status === 'PENDING' || status === 'PROCESSING') return 'Processando';
  if (status === 'AUTHORIZED') return 'Autorizada';
  if (status === 'REJECTED') return 'Rejeitada';
  if (status === 'CANCELLED') return 'Cancelada';
  if (status === 'ERROR') return 'Erro';
  return status || '-';
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
  const queryClient = useQueryClient();
  const [empresaSearch, setEmpresaSearch] = useState('');
  const [empresaSearchDebounced, setEmpresaSearchDebounced] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [empresaAutofillLabel, setEmpresaAutofillLabel] = useState<string | null>(null);
  const [cpfTomador, setCpfTomador] = useState('');
  const [valorDigits, setValorDigits] = useState<string>('');
  const [codigoServico, setCodigoServico] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
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

  const canSearchEmpresa = empresaSearchDebounced.trim().length >= 2;
  const { data: empresas = [], isLoading: empresasLoading } = useQuery({
    queryKey: ['empresas', 'quick-emit'],
    queryFn: empresasApi.list,
    staleTime: 60_000,
  });
  const empresaDefaultQuery = useQuery({
    queryKey: ['empresas', 'quick-emit-default'],
    queryFn: () => empresasApi.list({ limit: 20 }),
    staleTime: 60_000,
  });
  const empresaDefault = useMemo(() => {
    const items = empresaDefaultQuery.data || [];
    if (items.length === 0) return null;
    return items.find((empresa) => empresa.razaoSocial.toLowerCase().includes('burgus')) || items[0];
  }, [empresaDefaultQuery.data]);

  useEffect(() => {
    if (!empresaDefault) return;
    const defaultCnpj = empresaDefault.cnpj.replace(/\D/g, '');
    if (cnpjClean === defaultCnpj && empresaSearch.includes(defaultCnpj.slice(-4))) return;
    setCnpj(formatCNPJ(defaultCnpj));
    setEmpresaSearch(`${empresaDefault.razaoSocial} (${formatCNPJ(defaultCnpj)})`);
    setEmpresaAutofillLabel(empresaDefault.razaoSocial);
  }, [cnpjClean, empresaDefault, empresaSearch]);

  const filteredEmpresas = useMemo(() => {
    if (!canSearchEmpresa) return [];
    const search = empresaSearchDebounced.trim().toLowerCase();
    return empresas
      .filter((empresa) => {
        return empresa.razaoSocial.toLowerCase().includes(search)
          || empresa.cnpj.replace(/\D/g, '').includes(search.replace(/\D/g, ''));
      })
      .slice(0, 8);
  }, [canSearchEmpresa, empresaSearchDebounced, empresas]);

  const mutation = useMutation({
    mutationFn: () => nfseApi.emitirQuick({
      cnpj: cnpjClean,
      cpfTomador: cpfClean,
      valor: valorNumber,
      codigoServico: codigoServicoClean,
    }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['nfse'] });
      setApiError(null);
      setFormError(null);
      setCertRequiredBlock(false);
      setSuccess(data);
      toast({ title: 'NFSe enviada', description: 'Acompanhe o status na listagem de emissões.' });
      navigate('/nfse');
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
    <div className="space-y-6 animate-fade-in w-full">
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
                onChange={(e) => {
                  setEmpresaSearch(e.target.value);
                  setEmpresaAutofillLabel(null);
                }}
                placeholder="Digite razão social ou CNPJ"
              />
              {empresaAutofillLabel && (
                <p className="text-xs text-muted-foreground">
                  Empresa padrão carregada: {empresaAutofillLabel}
                </p>
              )}
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
                        setCnpj(formatCNPJ(empresa.cnpj));
                        setEmpresaSearch(`${empresa.razaoSocial} (${formatCNPJ(empresa.cnpj)})`);
                        setEmpresaAutofillLabel(null);
                      }}
                    >
                      <span className="font-medium">{empresa.razaoSocial}</span> ({formatCNPJ(empresa.cnpj)})
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
                onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
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

            <ServicoAutocomplete
              queryScope="quick-emit"
              value={serviceSearch}
              selectedCode={codigoServicoClean}
              helperClassName="text-sm"
              onValueChange={(next) => {
                setServiceSearch(next);
                setCodigoServico(extractServiceCode(next));
              }}
              onSelect={(item) => {
                setCodigoServico(item.codigoServico);
                setServiceSearch(`${item.codigoServico} - ${item.descricao}`);
              }}
            />

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
                  <p><strong>Status:</strong> {formatNfseStatus(success.result.status)}</p>
                  {STATUS_PROCESSING_SET.has(success.result.status) && <p>Nota enviada para processamento.</p>}
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
