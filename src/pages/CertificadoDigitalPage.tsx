import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { empresasApi } from '@/services/api';
import type { ApiError, ImportCertificadoDigitalResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Loader2, ShieldCheck, Upload } from 'lucide-react';

const CERT_EXTENSIONS = ['.pfx', '.p12'];

const getFileExtension = (fileName: string) => {
  const parts = fileName.toLowerCase().split('.');
  if (parts.length < 2) return '';
  return `.${parts[parts.length - 1]}`;
};

const formatFileSize = (size: number) => {
  if (!Number.isFinite(size) || size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const getApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as Partial<ApiError>;
    return {
      code: data.code || 'HTTP_ERROR',
      message: data.message || 'Falha ao importar certificado.',
      correlationId: data.correlationId,
      details: data.details,
    };
  }
  return {
    code: 'UNEXPECTED_ERROR',
    message: 'Falha ao importar certificado.',
  };
};

const CertificadoDigitalPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cnpj, setCnpj] = useState('');
  const [senhaCertificado, setSenhaCertificado] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState<ImportCertificadoDigitalResponse | null>(null);

  const cnpjClean = useMemo(() => cnpj.replace(/\D/g, ''), [cnpj]);
  const cnpjFromQuery = (searchParams.get('cnpj') || '').replace(/\D/g, '');

  useEffect(() => {
    if (!cnpjFromQuery) return;
    if (cnpjClean.length > 0) return;
    setCnpj(cnpjFromQuery);
  }, [cnpjClean.length, cnpjFromQuery]);

  const mutation = useMutation({
    mutationFn: () => empresasApi.importCertificadoDigital({
      cnpj: cnpjClean,
      senhaCertificado,
      file: file!,
    }),
    onSuccess: (data) => {
      setApiError(null);
      setFormError(null);
      setSuccess({
        ...data,
        fileName: data.fileName || file?.name || 'arquivo.pfx',
        fileSize: data.fileSize ?? file?.size ?? 0,
        uploadedAt: data.uploadedAt || new Date().toISOString(),
      });
    },
    onError: (error) => {
      setSuccess(null);
      setApiError(getApiError(error));
    },
  });

  const validate = () => {
    if (!cnpjClean || !senhaCertificado || !file) {
      return 'Preencha CNPJ, senha e arquivo.';
    }
    const ext = getFileExtension(file.name);
    if (!CERT_EXTENSIONS.includes(ext)) {
      return 'Arquivo inválido. Use .pfx ou .p12.';
    }
    return null;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setApiError(null);
    setSuccess(null);

    const validationError = validate();
    setFormError(validationError);
    if (validationError) return;

    mutation.mutate();
  };

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/empresas')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Certificado Digital</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Importação de Certificado A1</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senhaCertificado">Senha do certificado</Label>
              <Input
                id="senhaCertificado"
                type="password"
                value={senhaCertificado}
                onChange={(e) => setSenhaCertificado(e.target.value)}
                placeholder="Senha do .pfx/.p12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certFile">Arquivo (.pfx/.p12)</Label>
              <Input
                id="certFile"
                type="file"
                accept=".pfx,.p12"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
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
                <AlertTitle>Erro ao importar certificado</AlertTitle>
                <AlertDescription>
                  <p><strong>Código:</strong> {apiError.code}</p>
                  <p><strong>Mensagem:</strong> {apiError.message}</p>
                  {apiError.correlationId && <p><strong>Correlação:</strong> {apiError.correlationId}</p>}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Certificado importado</AlertTitle>
                <AlertDescription>
                  <p><strong>Arquivo:</strong> {success.fileName}</p>
                  <p><strong>Tamanho:</strong> {formatFileSize(success.fileSize)}</p>
                  <p><strong>Upload:</strong> {new Date(success.uploadedAt).toLocaleString('pt-BR')}</p>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Importar certificado
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificadoDigitalPage;
