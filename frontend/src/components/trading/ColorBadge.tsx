export interface ColorBadgeProps {
  color: string | null;
}

interface ColorMeta {
  label: string;
  classes: string;
}

const COLOR_MAP: Readonly<Record<string, ColorMeta>> = {
  red: {
    label: 'Rojo',
    classes: 'bg-digimon-red-bg border-digimon-red-border text-digimon-red-text',
  },
  blue: {
    label: 'Azul',
    classes: 'bg-digimon-blue-bg border-digimon-blue-border text-digimon-blue-text',
  },
  yellow: {
    label: 'Amarillo',
    classes: 'bg-digimon-yellow-bg border-digimon-yellow-border text-digimon-yellow-text',
  },
  green: {
    label: 'Verde',
    classes: 'bg-digimon-green-bg border-digimon-green-border text-digimon-green-text',
  },
  black: {
    label: 'Negro',
    classes: 'bg-digimon-black-bg border-digimon-black-border text-digimon-black-text',
  },
  purple: {
    label: 'Morado',
    classes: 'bg-digimon-purple-bg border-digimon-purple-border text-digimon-purple-text',
  },
  white: {
    label: 'Blanco',
    classes: 'bg-digimon-white-bg border-digimon-white-border text-digimon-white-text',
  },
};

export function ColorBadge({ color }: ColorBadgeProps) {
  if (!color) {
    return null;
  }

  const meta = COLOR_MAP[color.trim().toLowerCase()];
  const label = meta?.label ?? color;
  const classes =
    meta?.classes ?? 'bg-surface-2 border-border-default text-text-secondary';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none ${classes}`}
    >
      {label}
    </span>
  );
}
