import { useState } from 'react';
import type { CardDto } from '../../api/types';
import { ColorBadge } from './ColorBadge';
import { RarityBadge } from './RarityBadge';

export interface CardTileProps {
  card: CardDto;
  quantity?: number;
  compact?: boolean;
  highlighted?: boolean;
  className?: string;
}

export function CardTile({
  card,
  quantity,
  compact = false,
  highlighted = false,
  className = '',
}: CardTileProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(card.imageUrl) && failedUrl !== card.imageUrl;

  const surfaceClass = highlighted
    ? 'border-foil'
    : 'border border-border-subtle bg-surface-2';

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 rounded-lg p-2.5 ${surfaceClass} ${className}`.trim()}
      >
        <div className="relative w-14 shrink-0 overflow-hidden rounded-sm border border-border-default bg-surface-3 aspect-[63/88]">
          {showImage && card.imageUrl ? (
            <img
              key={card.imageUrl}
              src={card.imageUrl}
              alt={`${card.name} (${card.code})`}
              loading="lazy"
              onError={() => setFailedUrl(card.imageUrl)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-1 text-center">
              <span className="font-display text-[10px] font-bold text-text-secondary">
                {card.code}
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-display text-xs font-bold text-foil-cyan">
              {card.code}
            </span>
            {quantity !== undefined && (
              <span className="rounded bg-surface-3 px-1.5 py-0.5 font-display text-xs font-semibold text-text-primary">
                ×{quantity}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-sm font-semibold text-text-primary">
            {card.name}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <RarityBadge rarity={card.rarity} />
            <ColorBadge color={card.color} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-xl shadow-card ${surfaceClass} ${className}`.trim()}
    >
      <div className="relative w-full overflow-hidden bg-surface-3 aspect-[63/88]">
        {showImage && card.imageUrl ? (
          <img
            key={card.imageUrl}
            src={card.imageUrl}
            alt={`${card.name} (${card.code})`}
            loading="lazy"
            onError={() => setFailedUrl(card.imageUrl)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-3 text-center">
            <span className="font-display text-sm font-bold text-foil-cyan">
              {card.code}
            </span>
            <span className="text-xs text-text-muted">Sin imagen</span>
          </div>
        )}
        {quantity !== undefined && (
          <span className="absolute right-2 top-2 rounded-md border border-border-strong bg-bg-base/90 px-2 py-0.5 font-display text-xs font-bold text-text-primary">
            ×{quantity}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-xs font-bold text-foil-cyan">
            {card.code}
          </span>
          <RarityBadge rarity={card.rarity} />
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold text-text-primary">
          {card.name}
        </h3>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-1.5 pt-1">
          <ColorBadge color={card.color} />
          {card.cardType && (
            <span className="text-[11px] text-text-muted">{card.cardType}</span>
          )}
        </div>
      </div>
    </article>
  );
}
