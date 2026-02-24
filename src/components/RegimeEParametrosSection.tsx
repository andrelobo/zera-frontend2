import { FileText, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RegimeEParametrosSectionProps {
  regimeTributario: '' | 'simples_nacional' | 'lucro_presumido' | 'lucro_real';
  aliquotaSimplesNacional: string;
  apuracaoSimplesNacional: string;
  opcaoPeloSimples: '' | 'true' | 'false';
  opcaoPeloMei: '' | 'true' | 'false';
  dataOpcaoPeloSimples: string;
  dataExclusaoDoSimples: string;
  onChange: (field: string, value: string) => void;
}

const regimes = [
  { value: 'simples_nacional', label: 'Simples Nacional', desc: 'MEI, ME e EPP optantes pelo Simples' },
  { value: 'lucro_presumido', label: 'Lucro Presumido', desc: 'Tributação com base na presunção de lucro' },
  { value: 'lucro_real', label: 'Lucro Real', desc: 'Apuração com base no lucro efetivo' },
] as const;

const booleanChoices = [
  { value: 'true', label: 'Sim' },
  { value: 'false', label: 'Não' },
] as const;

const RegimeEParametrosSection = ({
  regimeTributario,
  aliquotaSimplesNacional,
  apuracaoSimplesNacional,
  opcaoPeloSimples,
  opcaoPeloMei,
  dataOpcaoPeloSimples,
  dataExclusaoDoSimples,
  onChange,
}: RegimeEParametrosSectionProps) => {
  const regimeApuracaoAtivo = apuracaoSimplesNacional.trim().length > 0;
  const informarAliquotaAtivo = aliquotaSimplesNacional.trim().length > 0;

  const renderBooleanCards = (
    title: string,
    field: 'opcaoPeloSimples' | 'opcaoPeloMei',
    value: '' | 'true' | 'false',
  ) => (
    <div className="space-y-2">
      <Label className="field-label">{title}</Label>
      <div className="grid grid-cols-2 gap-2">
        {booleanChoices.map((choice) => (
          <button
            key={`${field}-${choice.value}`}
            type="button"
            onClick={() => onChange(field, choice.value)}
            className={`radio-card justify-center ${value === choice.value ? 'radio-card-selected' : ''}`}
          >
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                value === choice.value ? 'border-primary' : 'border-muted-foreground/40'
              }`}
            >
              {value === choice.value && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <p className="text-sm font-semibold">{choice.label}</p>
          </button>
        ))}
      </div>
      {value !== '' && (
        <button
          type="button"
          className="text-xs text-muted-foreground underline"
          onClick={() => onChange(field, '')}
        >
          Limpar seleção
        </button>
      )}
    </div>
  );

  return (
    <div className="section-card">
      <h2 className="section-title">
        <span className="section-title-icon section-title-icon-primary">
          <FileText className="w-4 h-4" />
        </span>
        <span>
          Enquadramento Fiscal
          <span className="section-subtitle block">Regime e parâmetros tributários</span>
        </span>
      </h2>

      <div className="space-y-2">
        <Label className="field-label">Regime Tributário</Label>
        <div className="grid gap-3">
          {regimes.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => onChange('regimeTributario', r.value)}
              className={`radio-card text-left ${regimeTributario === r.value ? 'radio-card-selected' : ''}`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  regimeTributario === r.value ? 'border-primary' : 'border-muted-foreground/40'
                }`}
              >
                {regimeTributario === r.value && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <div>
                <p className="text-sm font-semibold">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mt-5 mb-3">
        <span className="section-title-icon section-title-icon-accent h-6 w-6 rounded-md">
          <Settings className="w-3.5 h-3.5" />
        </span>
        Parâmetro Federal
      </h3>
      <div className="grid gap-2 sm:grid-cols-2 mb-4">
        <button
          type="button"
          onClick={() =>
            onChange(
              'apuracaoSimplesNacional',
              regimeApuracaoAtivo ? '' : 'MENSAL',
            )
          }
          className={`radio-card text-left ${regimeApuracaoAtivo ? 'radio-card-selected' : ''}`}
        >
          <div
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
              regimeApuracaoAtivo ? 'border-primary' : 'border-muted-foreground/40'
            }`}
          >
            {regimeApuracaoAtivo && <div className="w-2 h-2 rounded-full bg-primary" />}
          </div>
          <div>
            <p className="text-sm font-semibold">Regime de apuração SN</p>
            <p className="text-xs text-muted-foreground">Ativa parâmetro de apuração federal</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            onChange(
              'aliquotaSimplesNacional',
              informarAliquotaAtivo ? '' : '0,00',
            )
          }
          className={`radio-card text-left ${informarAliquotaAtivo ? 'radio-card-selected' : ''}`}
        >
          <div
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
              informarAliquotaAtivo ? 'border-primary' : 'border-muted-foreground/40'
            }`}
          >
            {informarAliquotaAtivo && <div className="w-2 h-2 rounded-full bg-primary" />}
          </div>
          <div>
            <p className="text-sm font-semibold">Informar alíquota do SN</p>
            <p className="text-xs text-muted-foreground">Ativa edição da alíquota do Simples</p>
          </div>
        </button>
      </div>
      <div className="rounded-lg bg-gradient-to-br from-muted/60 to-background border border-border p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {informarAliquotaAtivo && (
            <div>
              <Label className="field-label whitespace-nowrap">Alíquota Simples Nacional</Label>
              <div className="relative">
                <Input
                  className="field-input pr-7"
                  value={aliquotaSimplesNacional}
                  onChange={(e) => onChange('aliquotaSimplesNacional', e.target.value)}
                  placeholder="00,00"
                  inputMode="decimal"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
          )}
          {regimeApuracaoAtivo && (
            <div>
              <Label className="field-label">Apuração Simples Nacional</Label>
              <Input
                className="field-input"
                value={apuracaoSimplesNacional}
                onChange={(e) => onChange('apuracaoSimplesNacional', e.target.value)}
                placeholder="Ex.: Mensal"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mt-4">
        {renderBooleanCards('Optante pelo Simples Nacional', 'opcaoPeloSimples', opcaoPeloSimples)}
        {renderBooleanCards('Optante pelo MEI', 'opcaoPeloMei', opcaoPeloMei)}
        <div>
          <Label className="field-label">Data Opção Simples</Label>
          <Input
            className="field-input"
            type="date"
            value={dataOpcaoPeloSimples}
            onChange={(e) => onChange('dataOpcaoPeloSimples', e.target.value)}
          />
        </div>
        <div>
          <Label className="field-label">Data Exclusão Simples</Label>
          <Input
            className="field-input"
            type="date"
            value={dataExclusaoDoSimples}
            onChange={(e) => onChange('dataExclusaoDoSimples', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default RegimeEParametrosSection;
