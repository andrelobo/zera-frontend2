import { useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';
import { BotMessageSquare } from 'lucide-react';
import { calcularSimplesAnexoIII, formatCurrency, formatPercent } from '@/utils/simples-nacional';

const TICKER_STORAGE_KEY = 'zera_global_ticker_tributario_v1';

type HeaderSnapshot = {
  rbt12: number;
  issReferencia: number;
  aliquotaEfetiva: number;
};

const fallbackCalculo = calcularSimplesAnexoIII(120000, 'III');
const FALLBACK_SNAPSHOT: HeaderSnapshot = {
  rbt12: 120000,
  issReferencia: fallbackCalculo.issReferencia,
  aliquotaEfetiva: fallbackCalculo.aliquotaEfetiva,
};

const parseSnapshot = (raw: string | null): HeaderSnapshot | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<HeaderSnapshot>;
    if (
      typeof parsed.rbt12 !== 'number'
      || typeof parsed.issReferencia !== 'number'
      || typeof parsed.aliquotaEfetiva !== 'number'
    ) {
      return null;
    }
    return {
      rbt12: parsed.rbt12,
      issReferencia: parsed.issReferencia,
      aliquotaEfetiva: parsed.aliquotaEfetiva,
    };
  } catch {
    return null;
  }
};

const AppLayout = () => {
  const [snapshot, setSnapshot] = useState<HeaderSnapshot>(() => {
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

  const receitaMes = snapshot.rbt12 / 12;
  const aRecolher = receitaMes * snapshot.aliquotaEfetiva;
  const headerKpis = useMemo(() => ([
    { label: 'Receita Jan 2026', value: formatCurrency(receitaMes) },
    { label: 'Aliq. Efetiva', value: formatPercent(snapshot.aliquotaEfetiva) },
    { label: 'Alíq. ISS', value: formatPercent(snapshot.issReferencia) },
    { label: 'A Recolher', value: formatCurrency(aRecolher), accent: true },
  ]), [aRecolher, receitaMes, snapshot.aliquotaEfetiva, snapshot.issReferencia]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="bg-[hsl(216,60%,16%)] sticky top-0 z-10 px-4 sm:px-6 py-2.5 flex items-center gap-6">
            <div className="flex items-center gap-4 shrink-0">
              <SidebarTrigger className="text-white hover:text-white/80" />
              <div className="h-5 w-px bg-white/20" />
              <span className="text-[10px] font-semibold text-white/50 tracking-widest flex items-center gap-1.5">
                <BotMessageSquare className="w-4 h-4 animate-[bounce_2s_ease-in-out_infinite]" />
                Inteligência Fiscal IA
              </span>
            </div>
            <div className="flex items-center gap-5">
              {headerKpis.map((kpi, index) => (
                <div key={kpi.label} className="flex items-center gap-5">
                  {index > 0 && <div className="h-5 w-px bg-white/10" />}
                  <div className="text-left">
                    <p className="text-[8px] text-white/40 uppercase tracking-widest font-medium">{kpi.label}</p>
                    <p className={`text-xs font-bold tabular-nums ${kpi.accent ? 'text-red-300' : 'text-white'}`}>{kpi.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 shrink-0" />
          </header>
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
