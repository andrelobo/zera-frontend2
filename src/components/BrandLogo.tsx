import { useId } from 'react';
import { cn } from '@/lib/utils';

type BrandSize = 'sm' | 'md' | 'lg';

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  size?: BrandSize;
  showTagline?: boolean;
  centered?: boolean;
  inverse?: boolean;
  markOnly?: boolean;
};

const sizeMap: Record<BrandSize, number> = {
  sm: 32,
  md: 48,
  lg: 72,
};

const titleSizeMap: Record<BrandSize, string> = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
};

export const BrandMark = ({ className, size = 'md' }: { className?: string; size?: BrandSize }) => {
  const px = sizeMap[size];
  const titleId = useId();
  const descriptionId = useId();

  return (
    <svg
      viewBox="0 0 128 96"
      width={Math.round(px * 1.33)}
      height={px}
      className={cn('shrink-0', className)}
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>Símbolo Jupati</title>
      <desc id={descriptionId}>Trama abstrata de fibras curvas conectadas.</desc>
      <g fill="none" strokeLinecap="round" strokeWidth="5">
        <path d="M8 24C34 24 42 72 66 72S96 24 120 24" stroke="currentColor" opacity="0.72" />
        <path d="M8 36C32 36 43 64 64 64s33-28 56-28" stroke="currentColor" opacity="0.9" />
        <path d="M8 48c24 0 35 8 56 8s34-8 56-8" stroke="currentColor" />
        <path d="M8 60c24 0 35-28 56-28s33 28 56 28" stroke="#829B7F" />
        <path d="M8 72c24 0 31-48 56-48s31 48 56 48" stroke="#6CA65D" />
      </g>
    </svg>
  );
};

const BrandLogo = ({
  className,
  markClassName,
  size = 'md',
  showTagline = false,
  centered = false,
  inverse = false,
  markOnly = false,
}: BrandLogoProps) => (
  <div className={cn('flex items-center gap-3', centered && 'justify-center', className)}>
    <BrandMark
      size={size}
      className={cn(inverse ? 'text-ivory-100' : 'text-foreground', markClassName)}
    />
    {!markOnly ? (
      <div className={cn('leading-tight', centered && 'text-center')}>
        <p
          className={cn(
            'font-display font-semibold uppercase tracking-[0.2em]',
            inverse ? 'text-ivory-100' : 'text-foreground',
            titleSizeMap[size],
          )}
        >
          Jupati
        </p>
        {showTagline ? (
          <p className={cn('mt-1 text-xs tracking-wide', inverse ? 'text-silver-300' : 'text-muted-foreground')}>
            Sua operação, bem conectada.
          </p>
        ) : null}
      </div>
    ) : null}
  </div>
);

export default BrandLogo;
