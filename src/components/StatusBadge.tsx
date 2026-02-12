import type { NfseStatus } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig: Record<NfseStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pendente', className: 'bg-warning/15 text-warning border-warning/30' },
  PROCESSING: { label: 'Processando', className: 'bg-info/15 text-info border-info/30' },
  AUTHORIZED: { label: 'Autorizada', className: 'bg-success/15 text-success border-success/30' },
  REJECTED: { label: 'Rejeitada', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  ERROR: { label: 'Erro', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  CANCELLED: { label: 'Cancelada', className: 'bg-muted text-muted-foreground border-muted' },
};

interface StatusBadgeProps {
  status: NfseStatus;
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status] || { label: status, className: '' };
  return (
    <Badge variant="outline" className={cn('font-medium', config.className, className)}>
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
