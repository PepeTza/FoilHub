import { useEffect, useId, type ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/80 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-border-default bg-surface-1 p-5 shadow-card"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-3">
          <div>
            <h2 id={titleId} className="font-display text-lg font-bold text-text-primary">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-text-secondary">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition hover:bg-surface-2 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan"
          >
            ✕
          </button>
        </div>

        <div className="py-4 text-sm text-text-secondary">{children}</div>

        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-border-subtle pt-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
