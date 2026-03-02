const Separator = () => <span className="text-muted-foreground/30 select-none">│</span>;

const GlobalTicker = () => {
  const items = (
    <>
      <div className="flex items-center gap-1.5 px-3 py-0.5 whitespace-nowrap bg-primary/10 rounded">
        <span className="text-[9px] uppercase tracking-wide text-primary">Sistema</span>
        <span className="text-xs font-bold text-primary">ZERA NFSe</span>
      </div>
      <Separator />
      <div className="flex items-center gap-1.5 px-3 py-0.5 whitespace-nowrap bg-primary/10 rounded">
        <span className="text-[9px] uppercase tracking-wide text-primary">Provider</span>
        <span className="text-xs font-bold text-primary">PlugNotas</span>
      </div>
      <Separator />
      <div className="flex items-center gap-1.5 px-3 py-0.5 whitespace-nowrap bg-primary/10 rounded">
        <span className="text-[9px] uppercase tracking-wide text-primary">Padrão</span>
        <span className="text-xs font-bold text-primary">NFSe Nacional</span>
      </div>
      <Separator />
      <div className="flex items-center gap-1.5 px-3 py-0.5 whitespace-nowrap bg-primary/10 rounded">
        <span className="text-[9px] uppercase tracking-wide text-primary">Modo</span>
        <span className="text-xs font-bold text-primary">Produção Assistida</span>
      </div>
    </>
  );

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
