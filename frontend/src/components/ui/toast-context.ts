import { createContext } from 'react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
}

export interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
