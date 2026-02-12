import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

const EmptyState = ({ title = 'Nada por aqui', message = 'Nenhum registro encontrado.', action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
    <Inbox className="h-10 w-10 mb-3" />
    <p className="font-medium text-foreground">{title}</p>
    <p className="text-sm mt-1">{message}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
