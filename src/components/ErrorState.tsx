import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorState = ({ message = 'Erro ao carregar dados.', onRetry }: ErrorStateProps) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/25 bg-destructive/10 px-6 py-16 text-center text-muted-foreground" role="alert">
    <div className="mb-4 rounded-full bg-destructive/10 p-3 text-destructive"><AlertCircle className="h-7 w-7" /></div>
    <p className="mb-4 max-w-md text-sm leading-6 text-foreground">{message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Tentar novamente
      </Button>
    )}
  </div>
);

export default ErrorState;
