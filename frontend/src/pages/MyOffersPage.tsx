import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getErrorMessage } from '../api/client';
import { cancelOffer, getOfferMatches, listMyOffers } from '../api/offers';
import type { OfferDto, OfferStatus } from '../api/types';
import { OfferCard } from '../components/trading';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Select,
  Skeleton,
  Spinner,
  useToast,
} from '../components/ui';
import { CancelOfferModal } from '../features/offers/CancelOfferModal';

type StatusFilter = '' | OfferStatus;

export function MyOffersPage() {
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [offers, setOffers] = useState<OfferDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [cancelTarget, setCancelTarget] = useState<OfferDto | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const [expandedMatches, setExpandedMatches] = useState<Record<string, boolean>>({});
  const [matchesByOffer, setMatchesByOffer] = useState<Record<string, OfferDto[]>>({});
  const [loadingMatches, setLoadingMatches] = useState<Record<string, boolean>>({});
  const [matchesError, setMatchesError] = useState<Record<string, string | null>>({});

  const reload = useCallback(() => {
    setReloadTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      listMyOffers(statusFilter || undefined)
        .then((items) => {
          if (!cancelled) {
            setOffers(items);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(
              getErrorMessage(err, 'No se pudieron cargar tus ofertas.'),
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
  }, [statusFilter, reloadTick]);

  async function handleConfirmCancel() {
    if (!cancelTarget) {
      return;
    }

    setCancelling(true);
    try {
      const updated = await cancelOffer(cancelTarget.id);
      setOffers((prev) => {
        if (statusFilter && updated.status !== statusFilter) {
          return prev.filter((item) => item.id !== updated.id);
        }
        return prev.map((item) => (item.id === updated.id ? updated : item));
      });
      setCancelTarget(null);
      showToast({
        variant: 'success',
        title: 'Oferta cancelada',
        description: 'Las propuestas pendientes fueron rechazadas automáticamente.',
      });
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'No se pudo cancelar la oferta.');
      showToast({
        variant: 'error',
        title: 'Error al cancelar',
        description: message,
      });
    } finally {
      setCancelling(false);
    }
  }

  async function handleToggleMatches(offerId: string) {
    const isExpanded = Boolean(expandedMatches[offerId]);
    if (isExpanded) {
      setExpandedMatches((prev) => ({ ...prev, [offerId]: false }));
      return;
    }

    setExpandedMatches((prev) => ({ ...prev, [offerId]: true }));
    if (matchesByOffer[offerId]) {
      return;
    }

    setLoadingMatches((prev) => ({ ...prev, [offerId]: true }));
    setMatchesError((prev) => ({ ...prev, [offerId]: null }));

    try {
      const found = await getOfferMatches(offerId);
      setMatchesByOffer((prev) => ({ ...prev, [offerId]: found }));
    } catch (err: unknown) {
      setMatchesError((prev) => ({
        ...prev,
        [offerId]: getErrorMessage(err, 'No se pudieron buscar matches.'),
      }));
    } finally {
      setLoadingMatches((prev) => ({ ...prev, [offerId]: false }));
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Mis ofertas
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Administra tus ofertas publicadas y revisa qué usuarios ofrecen justo lo contrario.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <Select
              label="Filtrar por estado"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              options={[
                { value: '', label: 'Todas' },
                { value: 'OPEN', label: 'Abiertas' },
                { value: 'COMPLETED', label: 'Completadas' },
                { value: 'CANCELLED', label: 'Canceladas' },
              ]}
            />
          </div>

          <Link
            to="/offers/new"
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-foil-gradient px-4 py-2 text-sm font-semibold text-text-inverse shadow-foil transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan"
          >
            Nueva oferta
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : offers.length === 0 ? (
        <EmptyState
          title={
            statusFilter
              ? 'No tienes ofertas en este estado'
              : 'Todavía no publicaste ninguna oferta'
          }
          description="Publica una oferta indicando qué carta entregas y cuál buscas."
          action={
            <Link
              to="/offers/new"
              className="inline-flex min-h-9 items-center justify-center rounded-md bg-foil-gradient px-3.5 py-1.5 text-xs font-semibold text-text-inverse shadow-foil focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan"
            >
              Crear primera oferta
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          {offers.map((offer) => {
            const showMatches = Boolean(expandedMatches[offer.id]);
            const matches = matchesByOffer[offer.id];
            const isMatchesLoading = Boolean(loadingMatches[offer.id]);
            const matchErr = matchesError[offer.id];

            return (
              <div key={offer.id} className="flex flex-col gap-3">
                <OfferCard
                  offer={offer}
                  actions={
                    <>
                      <Link
                        to={`/offers/${offer.id}`}
                        className="inline-flex min-h-8 items-center justify-center rounded-md border border-border-default bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan"
                      >
                        Ver detalle
                      </Link>
                      {offer.status === 'OPEN' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              void handleToggleMatches(offer.id);
                            }}
                          >
                            {showMatches ? 'Ocultar matches' : 'Ver matches'}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setCancelTarget(offer)}
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                    </>
                  }
                />

                {showMatches && (
                  <div className="ml-0 flex flex-col gap-3 rounded-xl border border-border-default bg-surface-1/70 p-4 md:ml-6">
                    <div className="flex items-center gap-2">
                      <Badge variant="foil">Matches exactos</Badge>
                      <span className="text-xs text-text-secondary">
                        Ofertas abiertas que entregan lo que buscas y piden lo que ofreces.
                      </span>
                    </div>

                    {isMatchesLoading ? (
                      <div className="flex items-center gap-2 py-2 text-sm text-text-secondary">
                        <Spinner size="sm" />
                        <span>Buscando matches...</span>
                      </div>
                    ) : matchErr ? (
                      <ErrorState
                        message={matchErr}
                        onRetry={() => {
                          setMatchesByOffer((prev) => {
                            const copy = { ...prev };
                            delete copy[offer.id];
                            return copy;
                          });
                          void handleToggleMatches(offer.id);
                        }}
                      />
                    ) : !matches || matches.length === 0 ? (
                      <p className="text-sm text-text-muted">
                        Todavía no hay matches exactos para esta oferta.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {matches.map((match) => (
                          <OfferCard
                            key={match.id}
                            offer={match}
                            highlighted
                            actions={
                              <Link
                                to={`/offers/${match.id}`}
                                className="inline-flex min-h-8 items-center justify-center rounded-md bg-foil-gradient px-3 py-1.5 text-xs font-semibold text-text-inverse shadow-foil hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan"
                              >
                                Ver oferta
                              </Link>
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CancelOfferModal
        open={Boolean(cancelTarget)}
        loading={cancelling}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          void handleConfirmCancel();
        }}
      />
    </section>
  );
}
