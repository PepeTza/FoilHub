import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { getErrorMessage } from '../api/client';
import { cancelOffer, getOffer, getOfferMatches } from '../api/offers';
import type { OfferDto } from '../api/types';
import { useAuth } from '../auth/useAuth';
import { OfferCard } from '../components/trading';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
  useToast,
} from '../components/ui';
import { CancelOfferModal } from '../features/offers/CancelOfferModal';
import { ProposeTradeModal } from '../features/proposals/ProposeTradeModal';

export function OfferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();

  const [offer, setOffer] = useState<OfferDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [matches, setMatches] = useState<OfferDto[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [proposeModalOpen, setProposeModalOpen] = useState(false);

  const reload = useCallback(() => {
    setReloadTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      getOffer(id)
        .then((loaded) => {
          if (!cancelled) {
            setOffer(loaded);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(getErrorMessage(err, 'No se pudo cargar la oferta.'));
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
  }, [id, reloadTick]);

  const isOwner = Boolean(offer && user && offer.owner.id === user.id);

  useEffect(() => {
    if (!offer || !isOwner || offer.status !== 'OPEN') {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setMatchesLoading(true);
      setMatchesError(null);
      getOfferMatches(offer.id)
        .then((items) => {
          if (!cancelled) {
            setMatches(items);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setMatchesError(
              getErrorMessage(err, 'No se pudieron cargar los matches.'),
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setMatchesLoading(false);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [offer, isOwner]);

  async function handleConfirmCancel() {
    if (!offer) {
      return;
    }

    setCancelling(true);
    try {
      const updated = await cancelOffer(offer.id);
      setOffer(updated);
      setCancelModalOpen(false);
      showToast({
        variant: 'success',
        title: 'Oferta cancelada',
        description: 'Las propuestas pendientes fueron rechazadas.',
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

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/"
            className="text-xs font-medium text-foil-cyan underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan"
          >
            ← Volver a explorar
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold text-text-primary">
            Detalle de oferta
          </h1>
        </div>
      </header>

      {loading ? (
        <Skeleton className="h-52 w-full rounded-xl" />
      ) : error || !offer ? (
        <ErrorState
          message={error ?? 'Oferta no encontrada.'}
          onRetry={reload}
        />
      ) : (
        <>
          <OfferCard
            offer={offer}
            actions={
              isOwner && offer.status === 'OPEN' ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setCancelModalOpen(true)}
                >
                  Cancelar oferta
                </Button>
              ) : !isOwner && offer.status === 'OPEN' ? (
                isAuthenticated ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setProposeModalOpen(true)}
                  >
                    Proponer trade
                  </Button>
                ) : (
                  <Link
                    to="/login"
                    state={{ from: `/offers/${offer.id}` }}
                    className="inline-flex min-h-8 items-center justify-center rounded-md bg-foil-gradient px-3 py-1.5 text-xs font-semibold text-text-inverse shadow-foil hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan"
                  >
                    Inicia sesión para proponer
                  </Link>
                )
              ) : undefined
            }
          />

          {isOwner && offer.status === 'OPEN' && (
            <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-1 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-bold text-text-primary">
                  Matches
                </h2>
                <Badge variant="foil">Inversa exacta</Badge>
              </div>

              {matchesLoading ? (
                <Skeleton className="h-36 w-full rounded-xl" />
              ) : matchesError ? (
                <ErrorState message={matchesError} onRetry={reload} />
              ) : matches.length === 0 ? (
                <EmptyState
                  title="Sin matches por ahora"
                  description="Cuando otro usuario publique una oferta exactamente inversa aparecerá aquí."
                />
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
            </section>
          )}
        </>
      )}

      <CancelOfferModal
        open={cancelModalOpen}
        loading={cancelling}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={() => {
          void handleConfirmCancel();
        }}
      />

      {offer && (
        <ProposeTradeModal
          open={proposeModalOpen}
          offer={offer}
          onClose={() => setProposeModalOpen(false)}
          onSuccess={() => {
            setProposeModalOpen(false);
            void navigate('/proposals', { state: { box: 'sent' } });
          }}
        />
      )}
    </section>
  );
}
