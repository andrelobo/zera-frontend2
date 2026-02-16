import { useMemo, useState } from 'react';
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { nfseApi } from '@/services/api';
import type { ApiError, EmitirNfseQuickResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Send, ShieldAlert } from 'lucide-react';

const CERT_REQUIRED_CODES = new Set(['CERTIFICADO_REQUIRED', 'QUICK_PRESTADOR_NO_CERT']);

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
  const [cpfTomador, setCpfTomador] = useState('');
  const [valor, setValor] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState<EmitirNfseQuickResponse | null>(null);
  const [certRequiredBlock, setCertRequiredBlock] = useState(false);

  const cpfClean = useMemo(() => cpfTomador.replace(/\D/g, ''), [cpfTomador]);
  const valorNumber = useMemo(() => Number(valor), [valor]);

  const mutation = useMutation({
    mutationFn: () => nfseApi.emitirQuick({
      cpfTomador: cpfClean,
      valor: valorNumber,
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
    if (!cpfClean) return 'Informe o CPF do tomador.';
    if (cpfClean.length !== 11) return 'CPF inválido. Informe 11 dígitos.';
    if (!Number.isFinite(valorNumber) || valorNumber <= 0) return 'Informe um valor maior que zero.';
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
          <CardTitle className="text-base">NFSe com CPF e valor</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpfTomador">CPF do tomador</Label>
              <Input
                id="cpfTomador"
                value={cpfTomador}
                onChange={(e) => setCpfTomador(e.target.value)}
                placeholder="Somente números"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor</Label>
              <Input
                id="valor"
                type="number"
                min="0"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
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
