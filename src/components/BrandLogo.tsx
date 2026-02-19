import { cn } from '@/lib/utils';

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  centered?: boolean;
};

const sizeMap = {
  sm: 28,
  md: 44,
  lg: 60,
} as const;

const titleSizeMap = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
} as const;

const BrandMark = ({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) => {
  const px = sizeMap[size];

  return (
    <svg
      viewBox="0 0 120 80"
      width={px}
      height={Math.round(px * 0.66)}
      className={className}
      role="img"
      aria-label="ZERA símbolo"
    >
      <defs>
        <linearGradient id="zera-teal" x1="20" y1="10" x2="60" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#36C7B6" />
          <stop offset="100%" stopColor="#20B7A5" />
        </linearGradient>
        <linearGradient id="zera-amber" x1="60" y1="12" x2="102" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F0C46A" />
          <stop offset="100%" stopColor="#E2B04F" />
        </linearGradient>
      </defs>

      <circle cx="42" cy="40" r="24" fill="none" stroke="url(#zera-teal)" strokeWidth="11" />
      <circle cx="78" cy="40" r="24" fill="none" stroke="url(#zera-amber)" strokeWidth="11" />

      <path d="M58 55 L66 48 L67 60 Z" fill="#20B7A5" />
      <path d="M62 25 L54 32 L53 20 Z" fill="#E2B04F" />

      <circle cx="60" cy="40" r="12" fill="hsl(var(--background))" />
      <text
        x="60"
        y="45"
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fill="hsl(var(--primary))"
        fontFamily="Inter, system-ui, sans-serif"
      >
        0
      </text>
    </svg>
  );
};

const BrandLogo = ({ className, markClassName, size = 'md', showTagline = false, centered = false }: BrandLogoProps) => {
  return (
    <div className={cn('flex items-center gap-2.5', centered && 'justify-center', className)}>
      <BrandMark size={size} className={markClassName} />
      <div className={cn('leading-tight', centered && 'text-center')}>
        <p className={cn('font-black tracking-wide text-primary', titleSizeMap[size])}>ZERA</p>
        {showTagline && <p className="text-xs text-muted-foreground">Inteligencia Tributaria AI</p>}
      </div>
    </div>
  );
};

export default BrandLogo;
