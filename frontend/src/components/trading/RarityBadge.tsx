export interface RarityBadgeProps {
  rarity: string | null;
}

const RARITY_CLASSES: Readonly<Record<string, string>> = {
  SEC: 'bg-foil-gradient border-transparent text-text-inverse font-bold',
  SR: 'bg-warning-bg border-warning-border text-warning-text font-semibold',
  R: 'bg-info-bg border-info-border text-info-text font-semibold',
  U: 'bg-surface-3 border-border-strong text-text-primary',
  C: 'bg-surface-2 border-border-default text-text-secondary',
  P: 'bg-digimon-purple-bg border-digimon-purple-border text-digimon-purple-text font-semibold',
};

export function RarityBadge({ rarity }: RarityBadgeProps) {
  if (!rarity) {
    return null;
  }

  const normalized = rarity.trim().toUpperCase();
  const classes =
    RARITY_CLASSES[normalized] ??
    'bg-surface-2 border-border-default text-text-secondary';

  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-display text-[11px] leading-none tracking-wide ${classes}`}
    >
      {normalized}
    </span>
  );
}
