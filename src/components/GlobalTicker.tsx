import { useEffect, useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { calcularSimplesAnexoIII, formatCurrency, formatPercent } from '@/utils/simples-nacional';

const TICKER_STORAGE_KEY = 'zera_global_ticker_tributario_v1';

type TickerSnapshot = {
  cnaeAnexo: string;
  faixa: number;
  rbt12: number;
  issReferencia: number;
  aliquotaEfetiva: number;
};

const Separator = () => <span className="text-muted-foreground/30 select-none">│</span>;

const fallbackCalculo = calcularSimplesAnexoIII(120000, 'III');
const FALLBACK_SNAPSHOT: TickerSnapshot = {
  cnaeAnexo: 'III',
  faixa: fallbackCalculo.faixa?.faixa ?? 1,
  rbt12: 120000,
  issReferencia: fallbackCalculo.issReferencia,
  aliquotaEfetiva: fallbackCalculo.aliquotaEfetiva,
};

const parseSnapshot = (raw: string | null): TickerSnapshot | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<TickerSnapshot>;
    if (
      typeof parsed.cnaeAnexo !== 'string'
      || typeof parsed.faixa !== 'number'
      || typeof parsed.rbt12 !== 'number'
      || typeof parsed.issReferencia !== 'number'
      || typeof parsed.aliquotaEfetiva !== 'number'
    ) {
      return null;
    }
    return parsed as TickerSnapshot;
  } catch {
    return null;
  }
};

const GlobalTicker = () => {
  const [snapshot, setSnapshot] = useState<TickerSnapshot>(() => {
    if (typeof window === 'undefined') return FALLBACK_SNAPSHOT;
    return parseSnapshot(window.localStorage.getItem(TICKER_STORAGE_KEY)) || FALLBACK_SNAPSHOT;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncFromStorage = () => {
      const next = parseSnapshot(window.localStorage.getItem(TICKER_STORAGE_KEY));
      if (next) setSnapshot(next);
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== TICKER_STORAGE_KEY) return;
      const next = parseSnapshot(event.newValue);
      if (next) setSnapshot(next);
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('zera:ticker:update', syncFromStorage as EventListener);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('zera:ticker:update', syncFromStorage as EventListener);
    };
  }, []);

  const items = useMemo(() => (
    <>
      <div className="flex items-center gap-1.5 px-3">
        <BarChart3 className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider whitespace-nowrap">Analytics</span>
      </div>
      <Separator />
      <div className="flex items-center gap-1.5 px-3 py-0.5 whitespace-nowrap bg-primary/10 rounded">
        <span className="text-[9px] uppercase tracking-wide text-primary">Anexo</span>
        <span className="text-xs font-bold text-primary">{snapshot.cnaeAnexo || 'III'}</span>
      </div>
      <Separator />
      <div className="flex items-center gap-1.5 px-3 py-0.5 whitespace-nowrap bg-primary/10 rounded">
        <span className="text-[9px] uppercase tracking-wide text-primary">Faixa</span>
        <span className="text-xs font-bold text-primary">{snapshot.faixa}ª</span>
      </div>
      <Separator />
      <div className="flex items-center gap-1.5 px-3 py-0.5 whitespace-nowrap bg-primary/10 rounded">
        <span className="text-[9px] uppercase tracking-wide text-primary">RBT12</span>
        <span className="text-xs font-bold text-primary">{formatCurrency(snapshot.rbt12)}</span>
      </div>
      <Separator />
      <div className="flex items-center gap-1.5 px-3 py-0.5 whitespace-nowrap bg-destructive/10 rounded animate-pulse">
        <span className="text-[9px] uppercase tracking-wide text-foreground">Alíq ISS</span>
        <span className="text-xs font-bold text-destructive">{formatPercent(snapshot.issReferencia)}</span>
      </div>
      <Separator />
      <div className="flex items-center gap-1.5 px-3 py-0.5 whitespace-nowrap bg-primary/10 rounded">
        <span className="text-[9px] uppercase tracking-wide text-primary">Alíq. Efetiva</span>
        <span className="text-xs font-bold text-primary">{formatPercent(snapshot.aliquotaEfetiva)}</span>
      </div>
    </>
  ), [snapshot]);

  return (
    <div className="w-full border-b border-primary/20 bg-gradient-to-r from-primary/5 via-card to-primary/5">
      <div className="px-4 lg:px-6">
        <div className="ticker-marquee py-1 rounded-sm">
          <div className="ticker-marquee-track">
            <div className="ticker-marquee-item flex items-center gap-1">
              {items}
            </div>
            <div className="ticker-marquee-item flex items-center gap-1" aria-hidden>
              {items}
            </div>
            <div className="ticker-marquee-item flex items-center gap-1" aria-hidden>
              {items}
            </div>
            <div className="ticker-marquee-item flex items-center gap-1" aria-hidden>
              {items}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalTicker;
