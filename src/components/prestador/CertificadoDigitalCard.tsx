import React, { useRef, useState } from 'react';
import { ShieldCheck, Upload, X, Eye, EyeOff, FileKey2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  certificado?: {
    filename?: string;
    uploadedAt?: string;
  } | null;
}

const CertificadoDigitalCard: React.FC<Props> = ({ certificado }) => {
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [showReplaceForm, setShowReplaceForm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const certificadoImportado = Boolean(certificado?.filename || certificado?.uploadedAt);
  const uploadedAtLabel = certificado?.uploadedAt
    ? new Date(certificado.uploadedAt).toLocaleString('pt-BR')
    : '';
  const exibirFormulario = !certificadoImportado || showReplaceForm;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pfx', '.p12'].includes(ext)) {
      toast.error('Formato inválido. Use arquivos .pfx ou .p12');
      return;
    }
    setNomeArquivo(file.name);
    toast.success(`Certificado "${file.name}" selecionado`);
  };

  const handleRemover = () => {
    setNomeArquivo('');
    setSenha('');
    if (inputRef.current) inputRef.current.value = '';
    toast.info('Certificado removido');
  };

  return (
    <div className="section-card">
      <h2 className="section-title">
        <ShieldCheck className="w-5 h-5 text-primary" />
        Certificado CNPJ A1
      </h2>
      {certificadoImportado && (
        <div className="mb-3 rounded-md border border-emerald-600/25 bg-emerald-600/10 px-3 py-2">
          <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              Certificado digital já importado
              {certificado?.filename ? `: ${certificado.filename}` : ''}
              {uploadedAtLabel ? ` (${uploadedAtLabel})` : ''}.
            </span>
          </p>
        </div>
      )}
      {certificadoImportado && !showReplaceForm && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => setShowReplaceForm(true)}
            className="btn-outline h-9 px-3 text-xs sm:text-sm"
          >
            Substituir certificado
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pfx,.p12"
        className="hidden"
        onChange={handleFileSelect}
      />
      {exibirFormulario && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Arquivo do Certificado</label>
          {!nomeArquivo ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="field-input w-full flex items-center gap-2 text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span className="text-sm">Importar .pfx ou .p12</span>
            </button>
          ) : (
            <div className="field-input flex items-center gap-2">
              <FileKey2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground truncate flex-1">
                {nomeArquivo}
              </span>
              <button
                type="button"
                onClick={handleRemover}
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
      )}
      {certificadoImportado && showReplaceForm && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setShowReplaceForm(false);
              handleRemover();
            }}
            className="btn-outline h-9 px-3 text-xs sm:text-sm"
          >
            Cancelar substituição
          </button>
        </div>
      )}
    </div>
  );
};

export default CertificadoDigitalCard;
