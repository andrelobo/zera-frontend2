import React from 'react';
import { Landmark, Percent } from 'lucide-react';

export type RegimeTributario = 'simples' | 'presumido' | 'real' | null;

export interface PercentuaisTributarios {
  federal: string;
  estadual: string;
  municipal: string;
}

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

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({
  checked, onChange, label,
}) => (
  <label className="flex items-center gap-3 cursor-pointer select-none">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`switch-track ${checked ? 'switch-track-on' : 'switch-track-off'}`}
    >
      <span className={`switch-thumb ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
    <span className="text-sm text-foreground">{label}</span>
  </label>
);

const RegimeEParametrosSection: React.FC<Props> = ({
  regime, onRegimeChange,
  informarAliquotaSN, onInformarAliquotaChange,
  aliquotaSN, onAliquotaSNChange,
  regimeApuracaoSNParametro, onRegimeApuracaoSNParametroChange,
  onAutosave,
}) => {
  const regimes: { value: RegimeTributario; label: string; desc: string; disabled?: boolean }[] = [
    { value: 'simples', label: 'Simples Nacional', desc: 'ME/EPP Optantes Simples Nacional' },
    { value: 'presumido', label: 'Lucro Presumido', desc: 'Em atualização.', disabled: true },
    { value: 'real', label: 'Lucro Real', desc: 'Em atualização.', disabled: true },
  ];

  const handleRegimeChange = (r: RegimeTributario) => {
    onRegimeChange(r);
    onAutosave();
  };

  return (
    <div className="section-card p-3">
      <h2 className="section-title text-sm mb-2">
        <Landmark className="w-4 h-4 text-primary" />
        Regime Tributário
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
        {regimes.map((r) => (
          <button
            key={r.value}
            type="button"
            disabled={r.disabled}
            onClick={() => !r.disabled && handleRegimeChange(r.value)}
            className={`radio-card text-left p-2 ${regime === r.value ? 'radio-card-selected' : ''} ${r.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              regime === r.value ? 'border-primary' : 'border-muted-foreground/40'
            }`}>
              {regime === r.value && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </div>
            <div>
              <div className="text-xs font-medium text-foreground leading-tight">{r.label}</div>
              <div className="text-[10px] text-muted-foreground leading-tight">{r.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RegimeEParametrosSection;
