import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import { Loader2, ShieldCheck, Upload, X, Eye, EyeOff, FileKey2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { empresasApi } from '@/services/api';
import { formatCNPJ } from '@/utils/validators';
import type { ApiError, ImportCertificadoDigitalResponse } from '@/types/api';

interface Props {
  cnpj?: string;
  certificado?: {
    filename?: string;
    size?: number;
    uploadedAt?: string;
    expiresAt?: string;
  } | null;
  onImported?: (result: ImportCertificadoDigitalResponse) => void | Promise<void>;
}

const CERT_EXTENSIONS = ['.pfx', '.p12'];

const getFileExtension = (fileName: string) => {
  const parts = fileName.toLowerCase().split('.');
  if (parts.length < 2) return '';
  return `.${parts[parts.length - 1]}`;
};

const formatDateLabel = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR');
};

const getExpirationStatus = (value?: string) => {
  if (!value) return '';
  const expiration = new Date(value);
  if (Number.isNaN(expiration.getTime())) return '';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfExpiration = new Date(expiration.getFullYear(), expiration.getMonth(), expiration.getDate());
  const diffInDays = Math.round((startOfExpiration.getTime() - startOfToday.getTime()) / 86400000);

  if (diffInDays < 0) return `Vencido ha ${Math.abs(diffInDays)} dia${Math.abs(diffInDays) === 1 ? '' : 's'}`;
  if (diffInDays == 0) return 'Vence hoje';
  if (diffInDays == 1) return 'Vence amanha';
  return `Vence em ${diffInDays} dias`;
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

const CertificadoDigitalCard: React.FC<Props> = ({ cnpj = '', certificado, onImported }) => {
  const [file, setFile] = useState<File | null>(null);
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [showReplaceForm, setShowReplaceForm] = useState(false);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [certificadoAtual, setCertificadoAtual] = useState<Props['certificado']>(certificado ?? null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cnpjClean = useMemo(() => cnpj.replace(/\D/g, ''), [cnpj]);
  const certificadoImportado = Boolean(certificadoAtual?.filename || certificadoAtual?.uploadedAt);
  const uploadedAtLabel = certificadoAtual?.uploadedAt
    ? new Date(certificadoAtual.uploadedAt).toLocaleString('pt-BR')
    : '';
  const expiresAtLabel = formatDateLabel(certificadoAtual?.expiresAt);
  const expirationStatus = getExpirationStatus(certificadoAtual?.expiresAt);

  useEffect(() => {
    setCertificadoAtual(certificado ?? null);
  }, [certificado]);

  const resetForm = () => {
    setFile(null);
    setSenha('');
    setApiError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0];
    if (!nextFile) return;
    const ext = getFileExtension(nextFile.name);
    if (!CERT_EXTENSIONS.includes(ext)) {
      toast.error('Formato inválido. Use arquivos .pfx ou .p12');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setFile(nextFile);
    setApiError(null);
    toast.success(`Certificado "${nextFile.name}" selecionado`);
  };

  const handleRemover = () => {
    resetForm();
    toast.info('Certificado removido');
  };

  const validate = () => {
    if (cnpjClean.length !== 14) return 'Informe um CNPJ válido antes de importar o certificado.';
    if (!senha.trim() || !file) return 'Selecione o arquivo e informe a senha do certificado.';
    const ext = getFileExtension(file.name);
    if (!CERT_EXTENSIONS.includes(ext)) return 'Arquivo inválido. Use .pfx ou .p12.';
    return null;
  };

  const mutation = useMutation({
    mutationFn: () => empresasApi.importCertificadoDigital({
      cnpj: cnpjClean,
      senhaCertificado: senha,
      file: file!,
    }),
    onSuccess: async (result) => {
      const nextCertificado = {
        filename: result.fileName || file?.name || certificadoAtual?.filename,
        size: result.fileSize ?? file?.size ?? certificadoAtual?.size,
        uploadedAt: result.uploadedAt || new Date().toISOString(),
        expiresAt: result.expiresAt || certificadoAtual?.expiresAt,
      };
      setApiError(null);
      setCertificadoAtual(nextCertificado);
      setShowReplaceForm(false);
      resetForm();
      toast.success('Certificado importado com sucesso');
      await onImported?.(result);
    },
    onError: (error) => {
      const nextError = getApiError(error);
      setApiError(nextError);
      toast.error(nextError.message);
    },
  });

  const handleImport = async () => {
    const validationError = validate();
    if (validationError) {
      setApiError({ code: 'VALIDATION_ERROR', message: validationError });
      toast.error(validationError);
      return;
    }

    setApiError(null);
    await mutation.mutateAsync();
  };

  if (certificadoImportado && !showReplaceForm) {
    return (
      <div className="section-card" id="certificado-digital-card">
        <h2 className="section-title">
          <ShieldCheck className="w-5 h-5 text-primary" />
          Certificado CNPJ A1
        </h2>
        <div className="mb-3 rounded-md border border-emerald-600/25 bg-emerald-600/10 px-3 py-2">
          <div className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p>
                Certificado digital já importado
                {certificadoAtual?.filename ? `: ${certificadoAtual.filename}` : ''}
                {uploadedAtLabel ? ` (${uploadedAtLabel})` : ''}.
              </p>
              {expiresAtLabel && (
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
                  Validade: {expiresAtLabel}
                  {expirationStatus ? ` · ${expirationStatus}` : ''}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowReplaceForm(true)}
            className="btn-outline h-9 px-3 text-xs sm:text-sm"
          >
            Substituir certificado
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="section-card" id="certificado-digital-card">
      <h2 className="section-title">
        <ShieldCheck className="w-5 h-5 text-primary" />
        Certificado CNPJ A1
      </h2>
      <div className="mb-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        {cnpjClean.length === 14 ? (
          <span>Certificado vinculado ao CNPJ {formatCNPJ(cnpjClean)}.</span>
        ) : (
          <span>Preencha um CNPJ válido no cadastro antes de importar o certificado.</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pfx,.p12"
        className="hidden"
        onChange={handleFileSelect}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Arquivo do Certificado</label>
          {!file ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="field-input w-full flex items-center gap-2 text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
              disabled={mutation.isPending}
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span className="text-sm">Importar .pfx ou .p12</span>
            </button>
          ) : (
            <div className="field-input flex items-center gap-2">
              <FileKey2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground truncate flex-1">
                {file.name}
              </span>
              <button
                type="button"
                onClick={handleRemover}
                disabled={mutation.isPending}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div>
          <label className="field-label">Senha do Certificado</label>
          <div className="relative">
            <input
              type={showSenha ? 'text' : 'password'}
              className="field-input pr-9"
              placeholder="Digite a senha do certificado"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={mutation.isPending}
            />
            <button
              type="button"
              onClick={() => setShowSenha(!showSenha)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
      {apiError && (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {apiError.message}
        </div>
      )}
      <div className="mt-3 flex justify-end gap-2">
        {certificadoImportado && showReplaceForm && (
          <button
            type="button"
            onClick={() => {
              setShowReplaceForm(false);
              handleRemover();
            }}
            disabled={mutation.isPending}
            className="btn-outline h-9 px-3 text-xs sm:text-sm"
          >
            Cancelar substituição
          </button>
        )}
        <button
          type="button"
          onClick={() => void handleImport()}
          disabled={mutation.isPending}
          className="btn-primary inline-flex h-9 items-center justify-center px-3 text-xs leading-none sm:text-sm"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {certificadoImportado ? 'Substituir certificado' : 'Importar certificado'}
            </>
          )}
        </button>
      </div>
      {certificadoImportado && showReplaceForm && (
        <p className="mt-2 text-xs text-muted-foreground">
          A substituição atualiza o certificado do prestador neste cadastro.
        </p>
      )}
    </div>
  );
};

export default CertificadoDigitalCard;
