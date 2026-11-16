import type { ReactNode } from 'react';
import type { OfferDto } from '../../api/types';
import { CardTile } from './CardTile';
import { StatusBadge } from './StatusBadge';

export interface OfferCardProps {
  offer: OfferDto;
  highlighted?: boolean;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

export function OfferCard({
  offer,
  highlighted = false,
  actions,
  footer,
  className = '',
}: OfferCardProps) {
  const frameClass = highlighted
    ? 'border-foil'
    : 'border border-border-subtle bg-surface-1';

  return (
    <article
      className={`flex flex-col gap-4 rounded-xl p-4 shadow-card ${frameClass} ${className}`.trim()}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="truncate font-semibold text-text-primary">
            @{offer.owner.username}
          </span>
          <span aria-hidden="true" className="text-text-muted">
            ·
          </span>
          <time dateTime={offer.createdAt} className="text-xs text-text-muted">
            {formatDate(offer.createdAt)}
          </time>
        </div>

        <StatusBadge status={offer.status} />
      </header>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 font-display text-xs font-semibold uppercase tracking-wider text-text-muted">
            Doy
          </p>
          <CardTile
            card={offer.offered.card}
            quantity={offer.offered.quantity}
            compact
          />
        </div>

        <div
          aria-hidden="true"
          className="flex shrink-0 items-center justify-center text-foil-cyan"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border-default bg-surface-2 font-display text-sm font-bold md:hidden">
            ↓
          </span>
          <span className="hidden h-8 w-8 items-center justify-center rounded-full border border-border-default bg-surface-2 font-display text-sm font-bold md:flex">
            →
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-1.5 font-display text-xs font-semibold uppercase tracking-wider text-text-muted">
            Quiero
          </p>
          <CardTile
            card={offer.wanted.card}
            quantity={offer.wanted.quantity}
            compact
          />
        </div>
      </div>

      {(footer || actions) && (
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-3">
          <div className="min-w-0 text-xs text-text-secondary">{footer}</div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </footer>
      )}
    </article>
  );
}
