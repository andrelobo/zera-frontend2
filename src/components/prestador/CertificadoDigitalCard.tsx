import React, { useRef, useState } from 'react';
import { ShieldCheck, Upload, X, Eye, EyeOff, FileKey2 } from 'lucide-react';
import { toast } from 'sonner';

const CertificadoDigitalCard: React.FC = () => {
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    </div>
  );
};

export default CertificadoDigitalCard;
