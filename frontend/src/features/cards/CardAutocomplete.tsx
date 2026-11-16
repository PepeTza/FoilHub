import { useEffect, useState } from 'react';
import { searchCards } from '../../api/cards';
import type { CardDto } from '../../api/types';
import { CardTile, ColorBadge, RarityBadge } from '../../components/trading';
import { Button, Combobox } from '../../components/ui';

export interface CardAutocompleteProps {
  label: string;
  selectedCard: CardDto | null;
  onSelect: (card: CardDto | null) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
}

export function CardAutocomplete({
  label,
  selectedCard,
  onSelect,
  placeholder = 'Busca por nombre o código (ej. Agumon, BT1-084)',
  helperText,
  error,
  disabled = false,
}: CardAutocompleteProps) {
  const [query, setQuery] = useState(() =>
    selectedCard ? `${selectedCard.code} — ${selectedCard.name}` : '',
  );
  const [options, setOptions] = useState<CardDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const trimmed = query.trim();
    const selectedLabel = selectedCard
      ? `${selectedCard.code} — ${selectedCard.name}`
      : '';
    const searchParam =
      selectedCard && trimmed === selectedLabel ? selectedCard.code : trimmed;

    const timer = window.setTimeout(() => {
      setLoading(true);
      searchCards({ search: searchParam || undefined, page: 1, pageSize: 10 })
        .then((page) => {
          if (!cancelled) {
            setOptions(page.items);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setOptions([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, selectedCard]);

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    if (selectedCard) {
      onSelect(null);
    }
  }

  function handleSelect(card: CardDto) {
    setQuery(`${card.code} — ${card.name}`);
    onSelect(card);
  }

  function handleClear() {
    setQuery('');
    onSelect(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <Combobox
        label={label}
        query={query}
        onQueryChange={handleQueryChange}
        options={options}
        getOptionKey={(card) => card.code}
        getOptionLabel={(card) => `${card.code} — ${card.name}`}
        onSelect={handleSelect}
        loading={loading}
        placeholder={placeholder}
        emptyMessage="No hay cartas que coincidan con tu búsqueda."
        helperText={helperText}
        error={error}
        disabled={disabled}
        renderOption={(card) => (
          <div className="flex items-center gap-2.5">
            <div className="w-8 shrink-0 overflow-hidden rounded-xs border border-border-default bg-surface-3 aspect-[63/88]">
              {card.imageUrl ? (
                <img
                  src={card.imageUrl}
                  alt={`${card.name} (${card.code})`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-display text-[8px] text-text-muted">
                  {card.code}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-display text-xs font-bold text-foil-cyan">
                  {card.code}
                </span>
                <span className="truncate font-medium text-text-primary">
                  {card.name}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <RarityBadge rarity={card.rarity} />
                <ColorBadge color={card.color} />
              </div>
            </div>
          </div>
        )}
      />

      {selectedCard && (
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <CardTile card={selectedCard} compact />
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={handleClear}
            aria-label={`Quitar ${selectedCard.name}`}
          >
            Quitar
          </Button>
        </div>
      )}
    </div>
  );
}
