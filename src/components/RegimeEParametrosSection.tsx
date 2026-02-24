import { Landmark } from 'lucide-react';
import type { ReactNode } from 'react';

type RegimeValue = '' | 'simples_nacional' | 'lucro_presumido' | 'lucro_real';

type NovastelasRegime = 'simples' | 'presumido' | 'real' | null;

interface RegimeEParametrosSectionProps {
  regimeTributario: RegimeValue;
  aliquotaSimplesNacional: string;
  apuracaoSimplesNacional: string;
  opcaoPeloSimples: '' | 'true' | 'false';
  opcaoPeloMei: '' | 'true' | 'false';
  dataOpcaoPeloSimples: string;
  dataExclusaoDoSimples: string;
  onChange: (field: string, value: string) => void;
  children?: ReactNode;
}

const regimeToNovastelas = (regime: RegimeValue): NovastelasRegime => {
  if (regime === 'simples_nacional') return 'simples';
  if (regime === 'lucro_presumido') return 'presumido';
  if (regime === 'lucro_real') return 'real';
  return null;
};

const novastelasToRegime = (regime: NovastelasRegime): RegimeValue => {
  if (regime === 'simples') return 'simples_nacional';
  if (regime === 'presumido') return 'lucro_presumido';
  if (regime === 'real') return 'lucro_real';
  return '';
};

const Toggle = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
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

const RegimeEParametrosSection = ({
  regimeTributario,
  aliquotaSimplesNacional,
  apuracaoSimplesNacional,
  onChange,
  children,
}: RegimeEParametrosSectionProps) => {
  const regime = regimeToNovastelas(regimeTributario);
  const informarAliquotaSN = aliquotaSimplesNacional.trim().length > 0;
  const regimeApuracaoSNParametro = apuracaoSimplesNacional.trim().length > 0;

  const regimes: { value: NovastelasRegime; label: string; desc: string }[] = [
    { value: 'simples', label: 'Simples Nacional', desc: 'MEI, ME e EPP optantes pelo Simples' },
    { value: 'presumido', label: 'Lucro Presumido', desc: 'Tributação com base na presunção de lucro' },
    { value: 'real', label: 'Lucro Real', desc: 'Apuração com base no lucro efetivo' },
  ];

  return (
    <div className="section-card">
      <h2 className="section-title">
        <Landmark className="w-5 h-5 text-primary" />
        Regime Tributário
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {regimes.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => onChange('regimeTributario', novastelasToRegime(r.value))}
            className={`radio-card text-left ${regime === r.value ? 'radio-card-selected' : ''}`}
          >
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                regime === r.value ? 'border-primary' : 'border-muted-foreground/40'
              }`}
            >
              {regime === r.value && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{r.label}</div>
              <div className="text-xs text-muted-foreground">{r.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {regime && (
        <h3 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: 'hsl(144, 72%, 28%)' }}>
          Parâmetro Federal
        </h3>
      )}

      {regime === 'simples' && (
        <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border mb-5">
          <Toggle
            checked={regimeApuracaoSNParametro}
            onChange={(v) => onChange('apuracaoSimplesNacional', v ? 'MENSAL' : '')}
            label="Regime de apuração dos tributos federais e municipal pelo Simples Nacional"
          />
          <Toggle
            checked={informarAliquotaSN}
            onChange={(v) => onChange('aliquotaSimplesNacional', v ? '0,00' : '')}
            label="Informar alíquota do Simples Nacional"
          />
          {informarAliquotaSN && (
            <div>
              <label className="field-label whitespace-nowrap">Simples Nacional</label>
              <div className="relative w-[55px]">
                <input
                  className="field-input pr-7 border-primary"
                  type="text"
                  placeholder="00,00"
                  maxLength={5}
                  value={aliquotaSimplesNacional}
                  onChange={(e) => {
                    let v = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
                    if (v.length > 2) v = `${v.slice(0, -2)},${v.slice(-2)}`;
                    onChange('aliquotaSimplesNacional', v);
                  }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default RegimeEParametrosSection;
