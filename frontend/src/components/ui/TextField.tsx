import { useId, type InputHTMLAttributes } from 'react';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
}

export function TextField({
  label,
  helperText,
  error,
  id,
  className = '',
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;
  const describedBy =
    [error ? errorId : null, helperText ? helperId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`min-h-10 w-full rounded-md border bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-danger-border' : 'border-border-default hover:border-border-strong'} ${className}`.trim()}
        {...rest}
      />
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
