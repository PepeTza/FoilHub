import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Spinner } from './Spinner';

export interface ComboboxProps<T> {
  label: string;
  query: string;
  onQueryChange: (nextQuery: string) => void;
  options: T[];
  getOptionKey: (option: T) => string;
  getOptionLabel: (option: T) => string;
  onSelect: (option: T) => void;
  renderOption?: (option: T, isActive: boolean) => ReactNode;
  loading?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
}

export function Combobox<T>({
  label,
  query,
  onQueryChange,
  options,
  getOptionKey,
  getOptionLabel,
  onSelect,
  renderOption,
  loading = false,
  placeholder = 'Buscar...',
  emptyMessage = 'No se encontraron resultados.',
  helperText,
  error,
  disabled = false,
}: ComboboxProps<T>) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const boundedActiveIndex =
    options.length > 0 ? Math.min(activeIndex, options.length - 1) : -1;

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  function selectOption(option: T) {
    onSelect(option);
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setOpen(true);
      setActiveIndex(0);
      return;
    }

    if (!open) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (options.length > 0) {
        setActiveIndex((prev) => (prev + 1) % options.length);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (options.length > 0) {
        setActiveIndex((prev) => (prev - 1 + options.length) % options.length);
      }
    } else if (event.key === 'Enter' && boundedActiveIndex >= 0) {
      const selected = options[boundedActiveIndex];
      if (selected) {
        event.preventDefault();
        selectOption(selected);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  const activeOptionId =
    open && boundedActiveIndex >= 0
      ? `${listboxId}-option-${boundedActiveIndex}`
      : undefined;

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          aria-invalid={Boolean(error)}
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className={`min-h-10 w-full rounded-md border bg-bg-base py-2 pl-3 pr-9 text-sm text-text-primary placeholder:text-text-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-danger-border' : 'border-border-default hover:border-border-strong'}`.trim()}
        />
        {loading && (
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
            <Spinner size="sm" label="Buscando" />
          </span>
        )}
      </div>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="absolute top-full z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border-default bg-surface-2 p-1 shadow-card"
        >
          {loading && options.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-text-muted">Buscando...</li>
          ) : options.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-text-muted">{emptyMessage}</li>
          ) : (
            options.map((option, index) => {
              const isActive = index === boundedActiveIndex;
              return (
                <li
                  key={getOptionKey(option)}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectOption(option);
                  }}
                  className={`cursor-pointer rounded-md px-3 py-2 text-sm transition ${isActive ? 'bg-surface-3 text-text-primary' : 'text-text-secondary hover:bg-surface-3'}`}
                >
                  {renderOption
                    ? renderOption(option, isActive)
                    : getOptionLabel(option)}
                </li>
              );
            })
          )}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-danger-text">
          {error}
        </p>
      )}
      {helperText && <p className="text-xs text-text-muted">{helperText}</p>}
    </div>
  );
}
