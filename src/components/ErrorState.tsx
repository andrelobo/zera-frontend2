import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorState = ({ message = 'Erro ao carregar dados.', onRetry }: ErrorStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
    <AlertCircle className="h-8 w-8 mb-3 text-destructive" />
    <p className="text-sm mb-4">{message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Tentar novamente
      </Button>
    )}
  </div>
);

export default ErrorState;
