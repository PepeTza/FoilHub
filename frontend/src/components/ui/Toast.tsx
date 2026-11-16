import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ToastContext,
  type ToastContextValue,
  type ToastOptions,
  type ToastVariant,
} from './toast-context';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

const DEFAULT_DURATION_MS = 4500;

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: 'border-success-border bg-success-bg text-success-text',
  error: 'border-danger-border bg-danger-bg text-danger-text',
  warning: 'border-warning-border bg-warning-bg text-warning-text',
  info: 'border-info-border bg-info-bg text-info-text',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());
  const nextIdRef = useRef(1);

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = `toast-${nextIdRef.current++}`;
      const variant = options.variant ?? 'info';
      const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;

      setToasts((prev) => [
        ...prev,
        {
          id,
          title: options.title,
          description: options.description,
          variant,
        },
      ]);

      if (durationMs > 0) {
        const timer = window.setTimeout(() => {
          dismissToast(id);
        }, durationMs);
        timersRef.current.set(id, timer);
      }
    },
    [dismissToast],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.variant === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start justify-between gap-3 rounded-lg border px-4 py-3 shadow-card ${VARIANT_CLASSES[toast.variant]}`}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-text-primary">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              aria-label="Cerrar notificación"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold hover:bg-surface-1/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
