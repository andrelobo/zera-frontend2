import React from 'react';
import { Badge } from '@/components/ui/badge';

interface BigNumberProps {
  value: string;
  label: string;
  accent?: string;
  badge?: string;
  badgeVariant?: 'default' | 'destructive' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
};

const BigNumber: React.FC<BigNumberProps> = ({
  value,
  label,
  accent = 'text-foreground',
  badge,
  badgeVariant = 'outline',
  size = 'md',
}) => (
  <div className="flex flex-col items-center text-center gap-1">
    <p className={`${sizeMap[size]} font-extrabold ${accent} leading-none`}>{value}</p>
    {badge ? (
      <Badge variant={badgeVariant} className="text-[9px] font-semibold mt-1">{badge}</Badge>
    ) : (
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
    )}
  </div>
);

export default BigNumber;
