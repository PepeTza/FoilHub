import { useId, type KeyboardEvent, type ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: ReactNode;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  ariaLabel?: string;
}

export function Tabs({
  items,
  activeTab,
  onChange,
  ariaLabel = 'Pestañas',
}: TabsProps) {
  const baseId = useId();
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeTab),
  );
  const current = items[activeIndex];

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (items.length === 0) {
      return;
    }

    let nextIndex = -1;
    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % items.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + items.length) % items.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = items.length - 1;
    }

    const nextItem = nextIndex >= 0 ? items[nextIndex] : undefined;
    if (nextItem) {
      event.preventDefault();
      onChange(nextItem.id);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex flex-wrap gap-1 border-b border-border-subtle pb-2"
      >
        {items.map((item, index) => {
          const isSelected = current?.id === item.id;
          return (
            <button
              key={item.id}
              id={`${baseId}-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onChange(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`inline-flex min-h-9 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan ${isSelected ? 'bg-surface-2 text-text-primary border border-border-default' : 'text-text-muted hover:bg-surface-2/60 hover:text-text-secondary border border-transparent'}`}
            >
              <span>{item.label}</span>
              {item.badge}
            </button>
          );
        })}
      </div>

      {current && (
        <div
          id={`${baseId}-panel-${current.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${current.id}`}
          tabIndex={0}
          className="focus-visible:outline-none"
        >
          {current.content}
        </div>
      )}
    </div>
  );
}
