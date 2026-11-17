import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { getErrorMessage } from '../../api/client';
import { listMyOffers } from '../../api/offers';
import { proposeTrade } from '../../api/proposals';
import type { OfferDto, ProposalDto } from '../../api/types';
import { Button, Modal, Select, Spinner, TextField, useToast } from '../../components/ui';

export interface ProposeTradeModalProps {
  open: boolean;
  offer: OfferDto;
  onClose: () => void;
  onSuccess: (proposal: ProposalDto) => void;
}

function isExactMatch(mine: OfferDto, target: OfferDto): boolean {
  return (
    mine.status === 'OPEN' &&
    mine.id !== target.id &&
    mine.offered.card.code === target.wanted.card.code &&
    mine.offered.quantity === target.wanted.quantity &&
    mine.wanted.card.code === target.offered.card.code &&
    mine.wanted.quantity === target.offered.quantity
  );
}

export function ProposeTradeModal({
  open,
  offer,
  onClose,
  onSuccess,
}: ProposeTradeModalProps) {
  const { showToast } = useToast();
  const [myOffers, setMyOffers] = useState<OfferDto[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [counterOfferId, setCounterOfferId] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoadingMatches(true);
      setFormError(null);
      listMyOffers('OPEN')
        .then((items) => {
          if (!cancelled) {
            setMyOffers(items);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setMyOffers([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoadingMatches(false);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open]);

  const matchingOffers = useMemo(
    () => myOffers.filter((mine) => isExactMatch(mine, offer)),
    [myOffers, offer],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (message.trim().length > 280) {
      setFormError('El mensaje no puede superar los 280 caracteres.');
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const created = await proposeTrade(offer.id, {
        counterOfferId: counterOfferId || undefined,
        message: message.trim() || undefined,
      });
      showToast({
        variant: 'success',
        title: 'Propuesta enviada',
        description: `Se envió tu propuesta a @${offer.owner.username}.`,
      });
      onSuccess(created);
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(
        err,
        'No se pudo enviar la propuesta. Intenta de nuevo.',
      );
      setFormError(errorMsg);
      showToast({
        variant: 'error',
        title: 'Error al proponer trade',
        description: errorMsg,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={submitting ? () => undefined : onClose}
      title="Proponer intercambio"
      description={`Oferta de @${offer.owner.username}: entrega ${offer.offered.quantity}× ${offer.offered.card.name} y busca ${offer.wanted.quantity}× ${offer.wanted.card.name}.`}
    >
      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        noValidate
        className="flex flex-col gap-4"
      >
        {formError && (
          <div
            role="alert"
            className="rounded-lg border border-danger-border bg-danger-bg px-3.5 py-2.5 text-sm text-danger-text"
          >
            {formError}
          </div>
        )}

        {loadingMatches ? (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Spinner size="sm" />
            <span>Buscando tus ofertas que hacen match...</span>
          </div>
        ) : matchingOffers.length > 0 ? (
          <Select
            label="Vincular una oferta mía que hace match (opcional)"
            placeholder="Sin contraoferta vinculada"
            value={counterOfferId}
            disabled={submitting}
            onChange={(event) => setCounterOfferId(event.target.value)}
            helperText="Si vinculas una oferta tuya, ambas se completarán al aceptar."
            options={matchingOffers.map((mine) => ({
              value: mine.id,
              label: `Doy ${mine.offered.quantity}× ${mine.offered.card.code} por ${mine.wanted.quantity}× ${mine.wanted.card.code}`,
            }))}
          />
        ) : (
          <p className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-xs text-text-muted">
            No tienes ofertas abiertas que hagan match exacto con esta; igualmente puedes proponer el trade directo.
          </p>
        )}

        <TextField
          label="Mensaje (opcional)"
          name="message"
          maxLength={280}
          placeholder="Ej. Puedo entregar en mano este fin de semana"
          helperText={`${message.trim().length}/280 caracteres`}
          disabled={submitting}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />

        <div className="flex flex-wrap justify-end gap-2 border-t border-border-subtle pt-3">
          <Button variant="ghost" disabled={submitting} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Enviar propuesta
          </Button>
        </div>
      </form>
    </Modal>
  );
}
