import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { getErrorMessage } from '../api/client';
import { createOffer } from '../api/offers';
import type { CardDto } from '../api/types';
import { Button, QuantityStepper, useToast } from '../components/ui';
import { CardAutocomplete } from '../features/cards/CardAutocomplete';

export function CreateOfferPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [offeredCard, setOfferedCard] = useState<CardDto | null>(null);
  const [offeredQuantity, setOfferedQuantity] = useState(1);
  const [wantedCard, setWantedCard] = useState<CardDto | null>(null);
  const [wantedQuantity, setWantedQuantity] = useState(1);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    offeredCard?: string;
    wantedCard?: string;
  }>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFieldErrors: { offeredCard?: string; wantedCard?: string } = {};
    if (!offeredCard) {
      nextFieldErrors.offeredCard = 'Selecciona la carta que entregas.';
    }
    if (!wantedCard) {
      nextFieldErrors.wantedCard = 'Selecciona la carta que buscas.';
    }
    if (offeredCard && wantedCard && offeredCard.code === wantedCard.code) {
      nextFieldErrors.wantedCard = 'No puedes ofrecer y pedir la misma carta.';
    }

    if (nextFieldErrors.offeredCard || nextFieldErrors.wantedCard) {
      setFieldErrors(nextFieldErrors);
      setFormError(null);
      return;
    }

    if (!offeredCard || !wantedCard) {
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const created = await createOffer({
        offeredCardCode: offeredCard.code,
        offeredQuantity,
        wantedCardCode: wantedCard.code,
        wantedQuantity,
      });
      showToast({
        variant: 'success',
        title: 'Oferta publicada',
        description: `${created.offered.quantity}× ${created.offered.card.name} → ${created.wanted.quantity}× ${created.wanted.card.name}`,
      });
      void navigate(`/offers/${created.id}`);
    } catch (err: unknown) {
      const message = getErrorMessage(
        err,
        'No se pudo publicar la oferta. Intenta de nuevo.',
      );
      setFormError(message);
      showToast({
        variant: 'error',
        title: 'Error al publicar oferta',
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Crear oferta
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Elige qué carta entregas, qué carta buscas y cuántas copias de cada una.
          </p>
        </div>

        <Link
          to="/offers/mine"
          className="text-sm font-medium text-foil-cyan underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan"
        >
          Ver mis ofertas
        </Link>
      </header>

      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        noValidate
        className="flex flex-col gap-6 rounded-xl border border-border-subtle bg-surface-1 p-5 shadow-card"
      >
        {formError && (
          <div
            role="alert"
            className="rounded-lg border border-danger-border bg-danger-bg px-3.5 py-2.5 text-sm text-danger-text"
          >
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-2/50 p-4">
            <h2 className="font-display text-base font-semibold text-foil-cyan">
              1. Carta que doy
            </h2>

            <CardAutocomplete
              label="Carta ofrecida"
              selectedCard={offeredCard}
              onSelect={setOfferedCard}
              error={fieldErrors.offeredCard}
              disabled={submitting}
            />

            <QuantityStepper
              label="Cantidad ofrecida"
              value={offeredQuantity}
              onChange={setOfferedQuantity}
              disabled={submitting}
            />
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-2/50 p-4">
            <h2 className="font-display text-base font-semibold text-foil-pink">
              2. Carta que quiero
            </h2>

            <CardAutocomplete
              label="Carta buscada"
              selectedCard={wantedCard}
              onSelect={setWantedCard}
              error={fieldErrors.wantedCard}
              disabled={submitting}
            />

            <QuantityStepper
              label="Cantidad buscada"
              value={wantedQuantity}
              onChange={setWantedQuantity}
              disabled={submitting}
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-border-subtle pt-4">
          <Button
            variant="ghost"
            disabled={submitting}
            onClick={() => void navigate('/')}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Publicar oferta
          </Button>
        </div>
      </form>
    </section>
  );
}
