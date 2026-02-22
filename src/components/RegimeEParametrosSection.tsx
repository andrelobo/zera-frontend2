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
        Parâmetro Fiscal
      </h3>
      <div className="rounded-lg bg-gradient-to-br from-muted/60 to-background border border-border p-4">
        <div className="grid gap-4 sm:grid-cols-2">
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
          <div>
            <Label className="field-label">Apuração Simples Nacional</Label>
            <Input
              className="field-input"
              value={apuracaoSimplesNacional}
              onChange={(e) => onChange('apuracaoSimplesNacional', e.target.value)}
              placeholder="Ex.: Mensal"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mt-4">
        <div>
          <Label className="field-label">Optante pelo Simples</Label>
          <select
            value={opcaoPeloSimples}
            onChange={(e) => onChange('opcaoPeloSimples', e.target.value)}
            className="field-input h-10"
          >
            <option value="">Não informado</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </div>
        <div>
          <Label className="field-label">Optante pelo MEI</Label>
          <select
            value={opcaoPeloMei}
            onChange={(e) => onChange('opcaoPeloMei', e.target.value)}
            className="field-input h-10"
          >
            <option value="">Não informado</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </div>
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
