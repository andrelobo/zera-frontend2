interface ParametroMunicipalSectionProps {
  cnae: string;
  cnaeDescricao?: string;
  ctn: string;
  nbs: string;
  rbt12?: string;
  onChange: (field: 'cnaeFiscal' | 'cnaeFiscalDescricao' | 'ctnCodigo' | 'nbsCodigo' | 'rbt12', value: string) => void;
  standalone?: boolean;
  ctnAutoFilled?: boolean;
  nbsAutoFilled?: boolean;
  assistHint?: string;
}

const ParametroMunicipalSection = ({
  cnae,
  cnaeDescricao = '',
  ctn,
  nbs,
  rbt12 = '',
  onChange,
  standalone = false,
  ctnAutoFilled,
  nbsAutoFilled,
  assistHint,
}: ParametroMunicipalSectionProps) => {
  return (
    <div className={standalone ? '' : 'mt-5 pt-5 border-t border-border'}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-primary">
        Parâmetro Municipal
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <label className="field-label">1. Código Cnae *</label>
          <input
            className="field-input"
            placeholder="Ex: 6201-5/00 ou 6201500"
            value={cnae}
            onChange={(e) => onChange('cnaeFiscal', e.target.value)}
          />
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <label className="field-label">2. Código Tributação Nacional *</label>
          <input
            className="field-input"
            placeholder="Buscar CTN..."
            value={ctn}
            onChange={(e) => onChange('ctnCodigo', e.target.value)}
          />
          {ctnAutoFilled && (
            <p className="mt-1 text-xs text-muted-foreground">
              Preenchido automaticamente pelo CNAE. Você pode editar.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <label className="field-label">3. Nomenclatura Brasileira Serviços</label>
          <input
            className="field-input"
            placeholder="Buscar NBS..."
            value={nbs}
            onChange={(e) => onChange('nbsCodigo', e.target.value)}
          />
          {nbsAutoFilled && (
            <p className="mt-1 text-xs text-muted-foreground">
              Preenchido automaticamente pelo CNAE. Você pode editar.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <label className="field-label">Descrição CNAE</label>
          <input
            className="field-input"
            placeholder="Descrição do CNAE"
            value={cnaeDescricao}
            onChange={(e) => onChange('cnaeFiscalDescricao', e.target.value)}
          />
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <label className="field-label">RBT12 (Simples Nacional)</label>
          <input
            className="field-input"
            placeholder="Ex: 150000,00"
            value={rbt12}
            onChange={(e) => onChange('rbt12', e.target.value)}
          />
        </div>
      </div>

      {assistHint && (
        <p className="mt-3 text-xs text-muted-foreground">{assistHint}</p>
      )}
    </div>
  );
};

export default ParametroMunicipalSection;
