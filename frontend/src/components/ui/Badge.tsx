import type { ReactNode } from 'react';

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'foil';

export interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-2 border-border-default text-text-secondary',
  info: 'bg-info-bg border-info-border text-info-text',
  success: 'bg-success-bg border-success-border text-success-text',
  warning: 'bg-warning-bg border-warning-border text-warning-text',
  danger: 'bg-danger-bg border-danger-border text-danger-text',
  foil: 'bg-foil-gradient border-transparent text-text-inverse font-semibold',
};

export function Badge({
  variant = 'neutral',
  className = '',
  children,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${VARIANT_CLASSES[variant]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
