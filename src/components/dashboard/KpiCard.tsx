import React from 'react';

interface KpiCardProps {
  label: string;
  value: string;
  accent?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, accent }) => (
  <div className="flex flex-col items-center justify-center min-w-[90px]">
    <p className="text-[9px] text-sidebar-foreground/50 font-semibold uppercase tracking-widest">{label}</p>
    <p className={`text-base font-bold leading-tight ${accent || 'text-sidebar-foreground'}`}>{value}</p>
  </div>
);

export default KpiCard;
