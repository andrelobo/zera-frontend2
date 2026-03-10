import React from 'react';

interface Props {
  label: string;
  value: number;
  max: number;
  formatValue?: (v: number) => string;
  color?: string;
}

const HorizontalBarItem: React.FC<Props> = ({ label, value, max, formatValue, color = 'hsl(var(--accent))' }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-muted-foreground font-medium w-20 truncate uppercase">{label}</span>
      <div className="flex-1 h-4 bg-muted rounded-sm overflow-hidden">
        <div className="h-full rounded-sm transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold text-foreground w-14 text-right">
        {formatValue ? formatValue(value) : `${pct.toFixed(0)}%`}
      </span>
    </div>
  );
};

export default HorizontalBarItem;
