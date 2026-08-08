import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

const EmptyState = ({ title = 'Nada por aqui', message = 'Nenhum registro encontrado.', action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-6 py-16 text-center text-muted-foreground">
    <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary"><Inbox className="h-7 w-7" /></div>
    <p className="font-display text-lg font-semibold text-foreground">{title}</p>
    <p className="mt-1 max-w-md text-sm leading-6">{message}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
