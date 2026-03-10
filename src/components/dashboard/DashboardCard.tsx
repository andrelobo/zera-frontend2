import React from 'react';

interface DashboardCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  rightHeader?: React.ReactNode;
  headerColor?: 'blue' | 'green' | 'red' | 'orange' | 'default';
}

const headerColorMap: Record<string, string> = {
  blue: 'bg-[hsl(220,60%,50%)] text-white',
  green: 'bg-[hsl(160,60%,40%)] text-white',
  red: 'bg-[hsl(0,65%,50%)] text-white',
  orange: 'bg-[hsl(38,80%,50%)] text-white',
  default: 'bg-muted text-foreground',
};

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  children,
  className = '',
  rightHeader,
  headerColor = 'default',
}) => (
  <div className={`rounded-lg border border-border bg-card shadow-sm overflow-hidden flex flex-col ${className}`}>
    {title && (
      <div className={`px-3 py-1 flex items-center justify-between ${headerColorMap[headerColor]}`}>
        <h3 className="text-[10px] font-bold tracking-wider">{title}</h3>
        {rightHeader && <div>{rightHeader}</div>}
      </div>
    )}
    <div className="p-2 flex-1">{children}</div>
  </div>
);

export default DashboardCard;
