import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'No se pudo cargar la información',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-xl border border-danger-border bg-danger-bg/40 px-6 py-8 text-center"
    >
      <div
        aria-hidden="true"
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-danger-border bg-danger-bg font-display text-base font-bold text-danger-text"
      >
        !
      </div>
      <h3 className="font-display text-base font-semibold text-danger-text">
        {title}
      </h3>
      <p className="mt-1 max-w-md text-sm text-text-primary">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}
