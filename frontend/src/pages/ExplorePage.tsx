import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getErrorMessage } from '../api/client';
import { listOpenOffers } from '../api/offers';
import type { CardDto, OfferDto, PageDto } from '../api/types';
import { useAuth } from '../auth/useAuth';
import { OfferCard } from '../components/trading';
import {
  Button,
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
} from '../components/ui';
import { CardAutocomplete } from '../features/cards/CardAutocomplete';

const PAGE_SIZE = 10;

export function ExplorePage() {
  const { isAuthenticated } = useAuth();
  const [offeredFilter, setOfferedFilter] = useState<CardDto | null>(null);
  const [wantedFilter, setWantedFilter] = useState<CardDto | null>(null);
  const [filterResetKey, setFilterResetKey] = useState(0);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PageDto<OfferDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const loadOffers = useCallback(() => {
    setReloadTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      listOpenOffers({
        offeredCardCode: offeredFilter?.code,
        wantedCardCode: wantedFilter?.code,
        page,
        pageSize: PAGE_SIZE,
      })
        .then((result) => {
          if (!cancelled) {
            setData(result);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(
              getErrorMessage(err, 'No se pudieron cargar las ofertas abiertas.'),
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [offeredFilter, wantedFilter, page, reloadTick]);

  function handleSelectOffered(card: CardDto | null) {
    setOfferedFilter(card);
    setPage(1);
  }

  function handleSelectWanted(card: CardDto | null) {
    setWantedFilter(card);
    setPage(1);
  }

  function handleClearFilters() {
    setOfferedFilter(null);
    setWantedFilter(null);
    setPage(1);
    setFilterResetKey((prev) => prev + 1);
  }

  const hasFilters = Boolean(offeredFilter || wantedFilter);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Explorar ofertas
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Encuentra cartas disponibles del Digimon Card Game y propón un intercambio.
          </p>
        </div>

        <Link
          to={isAuthenticated ? '/offers/new' : '/login'}
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-foil-gradient px-4 py-2 text-sm font-semibold text-text-inverse shadow-foil transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
        >
          Publicar oferta
        </Link>
      </header>

      <section
        aria-label="Filtros de ofertas"
        className="grid grid-cols-1 gap-4 rounded-xl border border-border-subtle bg-surface-1 p-4 md:grid-cols-2"
      >
        <CardAutocomplete
          key={`offered-${filterResetKey}`}
          label="Carta ofrecida (la que buscas recibir)"
          selectedCard={offeredFilter}
          onSelect={handleSelectOffered}
          placeholder="Filtrar por carta ofrecida..."
        />

        <CardAutocomplete
          key={`wanted-${filterResetKey}`}
          label="Carta buscada (la que piden)"
          selectedCard={wantedFilter}
          onSelect={handleSelectWanted}
          placeholder="Filtrar por carta buscada..."
        />

        {hasFilters && (
          <div className="flex justify-end md:col-span-2">
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </section>

      {loading ? (
        <div className="flex flex-col gap-4" aria-label="Cargando ofertas">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadOffers} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title={
            hasFilters
              ? 'No hay ofertas con esos filtros'
              : 'No hay ofertas abiertas todavía'
          }
          description={
            hasFilters
              ? 'Prueba quitando o cambiando las cartas seleccionadas.'
              : 'Sé el primero en publicar una oferta de intercambio.'
          }
          action={
            hasFilters ? (
              <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                Quitar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {data.items.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              actions={
                <Link
                  to={`/offers/${offer.id}`}
                  className="inline-flex min-h-9 items-center justify-center rounded-md border border-border-default bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-primary transition hover:bg-surface-3 hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan"
                >
                  Ver detalle
                </Link>
              }
            />
          ))}

          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPageChange={setPage}
          />
        </div>
      )}
    </section>
  );
}
