import { useId } from 'react';

export interface QuantityStepperProps {
  label?: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  error?: string;
}

export function QuantityStepper({
  label = 'Cantidad',
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  error,
}: QuantityStepperProps) {
  const id = useId();

  function clamp(next: number): number {
    if (!Number.isFinite(next)) {
      return min;
    }
    return Math.min(max, Math.max(min, Math.trunc(next)));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <div className="inline-flex w-fit items-center rounded-md border border-border-default bg-bg-base">
        <button
          type="button"
          aria-label={`Disminuir ${label.toLowerCase()}`}
          disabled={disabled || value <= min}
          onClick={() => onChange(clamp(value - 1))}
          className="flex h-10 w-10 items-center justify-center rounded-l-md text-base font-semibold text-text-secondary transition hover:bg-surface-2 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          disabled={disabled}
          value={value}
          onChange={(event) => {
            const parsed = Number(event.target.value);
            onChange(clamp(parsed));
          }}
          className="h-10 w-14 border-x border-border-subtle bg-transparent text-center font-display text-sm font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label={`Aumentar ${label.toLowerCase()}`}
          disabled={disabled || value >= max}
          onClick={() => onChange(clamp(value + 1))}
          className="flex h-10 w-10 items-center justify-center rounded-r-md text-base font-semibold text-text-secondary transition hover:bg-surface-2 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}
