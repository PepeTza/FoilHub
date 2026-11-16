import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-1/60 px-6 py-10 text-center">
      <div
        aria-hidden="true"
        className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-border-default bg-surface-2 font-display text-lg text-foil-cyan"
      >
        ◇
      </div>
      <h3 className="font-display text-base font-semibold text-text-primary">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-md text-sm text-text-secondary">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
