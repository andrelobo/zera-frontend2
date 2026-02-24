interface ParametroMunicipalSectionProps {
  cnae: string;
  ctn: string;
  nbs: string;
  onChange: (field: 'cnaeFiscal' | 'ctnCodigo' | 'nbsCodigo', value: string) => void;
}

const ParametroMunicipalSection = ({
  cnae,
  ctn,
  nbs,
  onChange,
}: ParametroMunicipalSectionProps) => {
  return (
    <div className="mt-5 pt-5 border-t border-border">
      <h3 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: 'hsl(144, 72%, 28%)' }}>
        Parâmetro Municipal
      </h3>

      <div className="space-y-4">
        <div>
          <label className="field-label">1. Código Cnae *</label>
          <input
            className="field-input"
            placeholder="Ex: 6201-5/00 ou 6201500"
            value={cnae}
            onChange={(e) => onChange('cnaeFiscal', e.target.value)}
          />
        </div>

        <div>
          <label className="field-label">2. Código Tributação Nacional *</label>
          <input
            className="field-input"
            placeholder="Buscar CTN..."
            value={ctn}
            onChange={(e) => onChange('ctnCodigo', e.target.value)}
          />
        </div>

        <div>
          <label className="field-label">3. Nomenclatura Brasileira Serviços</label>
          <input
            className="field-input"
            placeholder="Buscar NBS..."
            value={nbs}
            onChange={(e) => onChange('nbsCodigo', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default ParametroMunicipalSection;
