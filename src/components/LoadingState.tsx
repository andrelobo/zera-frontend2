import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

const LoadingState = ({ message = 'Carregando...' }: LoadingStateProps) => {
  const navBlue = '#102a56';

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="mb-3 flex items-center">
        <Loader2
          className="h-8 w-8 animate-spin"
          style={{ color: navBlue }}
        />
      </div>
      <p className="text-sm font-medium" style={{ color: navBlue }}>{message}</p>
      <p className="mt-1 text-[11px]" style={{ color: navBlue }}>
        Carregando dados...
      </p>
    </div>
  );
};

export default LoadingState;
