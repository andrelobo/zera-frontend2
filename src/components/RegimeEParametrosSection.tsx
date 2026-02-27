import { Landmark } from 'lucide-react';

export type RegimeTributario = 'simples' | 'presumido' | 'real' | null;

interface Props {
  regime: RegimeTributario;
  onRegimeChange: (r: RegimeTributario) => void;
  informarAliquotaSN: boolean;
  onInformarAliquotaChange: (v: boolean) => void;
  aliquotaSN: string;
  onAliquotaSNChange: (v: string) => void;
  regimeApuracaoSNParametro: boolean;
  onRegimeApuracaoSNParametroChange: (v: boolean) => void;
  onAutosave: () => void;
}

const RegimeEParametrosSection = ({
  regime,
  onRegimeChange,
}: Props) => {
  const regimes: { value: RegimeTributario; label: string; desc: string; disabled?: boolean }[] = [
    { value: 'simples', label: 'Simples Nacional', desc: 'ME/EPP Optantes Simples Nacional' },
    { value: 'presumido', label: 'Lucro Presumido', desc: 'Em atualização.', disabled: true },
    { value: 'real', label: 'Lucro Real', desc: 'Em atualização.', disabled: true },
  ];

  const handleRegimeChange = (nextRegime: RegimeTributario) => {
    onRegimeChange(nextRegime);
  };

  return (
    <div className="section-card p-3">
      <h2 className="section-title text-sm mb-2">
        <Landmark className="w-4 h-4 text-primary" />
        Regime Tributário
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
        {regimes.map((item) => (
          <button
            key={item.value}
            type="button"
            disabled={item.disabled}
            onClick={() => !item.disabled && handleRegimeChange(item.value)}
            className={`radio-card text-left p-2 ${regime === item.value ? 'radio-card-selected' : ''} ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              regime === item.value ? 'border-primary' : 'border-muted-foreground/40'
            }`}
            >
              {regime === item.value && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </div>
            <div>
              <div className="text-xs font-medium text-foreground leading-tight">{item.label}</div>
              <div className="text-[10px] text-muted-foreground leading-tight">{item.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RegimeEParametrosSection;
