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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Building2, Loader2, Send, ShieldAlert } from 'lucide-react';
import ServicoAutocomplete from '@/components/emissao/ServicoAutocomplete';
import { mapListaServicoFromConfig, pickEmpresaForEmissao } from './nfseEmit.mappers';
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
  const [empresaSelecionadaCnpj, setEmpresaSelecionadaCnpj] = useState('');
  const [cpfTomador, setCpfTomador] = useState('');
  const [valorDigits, setValorDigits] = useState<string>('');
  const [codigoServico, setCodigoServico] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState<EmitirNfseQuickResponse | null>(null);
  const [certRequiredBlock, setCertRequiredBlock] = useState(false);

  const cnpjClean = useMemo(() => empresaSelecionadaCnpj.replace(/\D/g, ''), [empresaSelecionadaCnpj]);
  const cpfClean = useMemo(() => cpfTomador.replace(/\D/g, ''), [cpfTomador]);
  const codigoServicoClean = useMemo(() => codigoServico.replace(/\D/g, ''), [codigoServico]);
  const valorNumber = useMemo(() => Number(valorDigits || '0') / 100, [valorDigits]);
  const valorMasked = useMemo(() => formatCurrencyFromDigits(valorDigits), [valorDigits]);

  const empresasQuery = useQuery({
    queryKey: ['empresas', 'quick-emit-options'],
    queryFn: () => empresasApi.list({ limit: 50 }),
    staleTime: 60_000,
  });
  const empresasDisponiveis = useMemo(() => empresasQuery.data || [], [empresasQuery.data]);
  const empresaSelecionada = useMemo(
    () => empresasDisponiveis.find((empresa) => empresa.cnpj.replace(/\D/g, '') === cnpjClean) || null,
    [cnpjClean, empresasDisponiveis],
  );

  useEffect(() => {
    if (empresasDisponiveis.length === 0) return;
    const currentStillExists = empresasDisponiveis.some((empresa) => empresa.cnpj.replace(/\D/g, '') === cnpjClean);
    if (currentStillExists && cnpjClean.length === 14) return;
    const preferred = pickEmpresaForEmissao(empresasDisponiveis) ?? empresasDisponiveis[0];
    const defaultCnpj = preferred?.cnpj.replace(/\D/g, '') || '';
    if (!defaultCnpj) return;
    setEmpresaSelecionadaCnpj(defaultCnpj);
  }, [cnpjClean, empresasDisponiveis]);

  useEffect(() => {
    setApiError(null);
    setFormError(null);
    setSuccess(null);
    setCertRequiredBlock(false);
  }, [cnpjClean]);

  const empresaDetalheQuery = useQuery({
    queryKey: ['empresas', 'quick-emit-detail', cnpjClean],
    queryFn: () => empresasApi.getByCnpj(cnpjClean),
    enabled: cnpjClean.length === 14,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const servicosCadastrados = useMemo(() => {
    const itens = mapListaServicoFromConfig(empresaDetalheQuery.data || undefined)
      .filter((item) => Boolean(item.codigoServico))
      .map((item) => ({
        ...item,
        codigoServico: String(item.codigoServico || '').replace(/\D/g, '').slice(0, 6),
      }))
      .filter((item) => item.codigoServico.length === 6);

    const unique = new Map();
    itens.forEach((item) => {
      const key = `${item.codigoServico}::${item.natureza.trim().toLowerCase()}::${item.descricao.trim().toLowerCase()}`;
      if (!unique.has(key)) unique.set(key, item);
    });
    return Array.from(unique.values());
  }, [empresaDetalheQuery.data]);

  const usarServicosDoCadastro = servicosCadastrados.length > 0;

  useEffect(() => {
    if (!usarServicosDoCadastro) return;
    if (!codigoServicoClean) return;
    const stillExists = servicosCadastrados.some((item) => item.codigoServico === codigoServicoClean);
    if (stillExists) return;
    setCodigoServico('');
    setServiceSearch('');
  }, [codigoServicoClean, servicosCadastrados, usarServicosDoCadastro]);

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
          <CardTitle className="text-base">NFSe rápida com seleção de prestador, CPF e valor</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <Label htmlFor="prestadorQuickSelect">Prestador</Label>
                  <Select value={cnpjClean} onValueChange={setEmpresaSelecionadaCnpj}>
                    <SelectTrigger id="prestadorQuickSelect">
                      <SelectValue placeholder={empresasQuery.isLoading ? 'Carregando prestadores...' : 'Selecione o prestador'} />
                    </SelectTrigger>
                    <SelectContent>
                      {empresasDisponiveis.map((empresa) => {
                        const empresaCnpj = empresa.cnpj.replace(/\D/g, '');
                        return (
                          <SelectItem key={empresa.id || empresaCnpj} value={empresaCnpj}>
                            {`${empresa.razaoSocial} (${formatCNPJ(empresaCnpj)})`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {empresaSelecionada
                      ? `Emitindo por ${empresaSelecionada.razaoSocial} • ${formatCNPJ(cnpjClean)}`
                      : 'Selecione a empresa prestadora para esta emissão.'}
                  </p>
                </div>
              </div>
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

            {usarServicosDoCadastro ? (
              <div className="space-y-2">
                <Label htmlFor="codigoServicoCadastro">Serviço do cadastro</Label>
                <Select
                  value={codigoServicoClean}
                  onValueChange={(nextCodigo) => {
                    const item = servicosCadastrados.find((entry) => entry.codigoServico === nextCodigo);
                    setCodigoServico(nextCodigo);
                    setServiceSearch(item ? `${item.codigoServico} - ${item.descricao}` : '');
                  }}
                >
                  <SelectTrigger id="codigoServicoCadastro">
                    <SelectValue placeholder={`Selecione entre ${servicosCadastrados.length} serviço(s) cadastrados`} />
                  </SelectTrigger>
                  <SelectContent>
                    {servicosCadastrados.map((item) => (
                      <SelectItem
                        key={`${item.id}-${item.codigoServico}`}
                        value={item.codigoServico}
                      >
                        {`${item.codigoServico} - ${item.descricao}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Serviços do cadastro do prestador selecionado.
                </p>
              </div>
            ) : (
              <>
                {empresaDetalheQuery.isFetching && cnpjClean.length === 14 && (
                  <p className="text-sm text-muted-foreground">Carregando serviços do cadastro...</p>
                )}
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
                {empresaDetalheQuery.isFetched && cnpjClean.length === 14 && (
                  <p className="text-sm text-muted-foreground">
                    Cadastro sem serviços configurados. Usando catálogo global como fallback.
                  </p>
                )}
              </>
            )}

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
