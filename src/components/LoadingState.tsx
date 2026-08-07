interface LoadingStateProps {
  message?: string;
}

const LoadingState = ({ message = 'Carregando...' }: LoadingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16" aria-live="polite" aria-busy="true">
      <div className="mb-3 flex items-center">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
      </div>
      <p className="text-sm font-medium text-foreground">{message}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Carregando dados...
      </p>
    </div>
  );
};

export default LoadingState;
