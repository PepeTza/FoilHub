import { useId, type SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  helperText?: string;
  error?: string;
}

export function Select({
  label,
  options,
  placeholder,
  helperText,
  error,
  id,
  className = '',
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const helperId = `${selectId}-helper`;
  const errorId = `${selectId}-error`;
  const describedBy =
    [error ? errorId : null, helperText ? helperId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`min-h-10 w-full rounded-md border bg-bg-base px-3 py-2 text-sm text-text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-danger-border' : 'border-border-default hover:border-border-strong'} ${className}`.trim()}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger-text">
          {error}
        </p>
      )}
      {helperText && (
        <p id={helperId} className="text-xs text-text-muted">
          {helperText}
        </p>
      )}
    </div>
  );
}
