import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

const LoadingState = ({ message = 'Carregando...' }: LoadingStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
    <Loader2 className="h-8 w-8 animate-spin mb-3" />
    <p className="text-sm">{message}</p>
  </div>
);

export default LoadingState;
