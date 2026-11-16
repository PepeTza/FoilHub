export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-9 w-9 border-[3px]',
};

export function Spinner({
  size = 'md',
  label = 'Cargando',
  className = '',
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block rounded-full border-border-strong border-t-foil-cyan animate-spin motion-reduce:animate-none ${SIZE_CLASSES[size]} ${className}`.trim()}
    />
  );
}
