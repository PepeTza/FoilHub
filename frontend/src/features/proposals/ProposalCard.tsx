import { Link } from 'react-router';
import type { ProposalBox } from '../../api/proposals';
import type { ProposalDto } from '../../api/types';
import { OfferCard, StatusBadge } from '../../components/trading';
import { Badge, Button } from '../../components/ui';

export interface ProposalCardProps {
  proposal: ProposalDto;
  box: ProposalBox;
  busy?: boolean;
  onAccept?: (proposal: ProposalDto) => void;
  onReject?: (proposal: ProposalDto) => void;
  onCancel?: (proposal: ProposalDto) => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function ProposalCard({
  proposal,
  box,
  busy = false,
  onAccept,
  onReject,
  onCancel,
}: ProposalCardProps) {
  const isPending = proposal.status === 'PENDING';
  const showContacts =
    proposal.status === 'ACCEPTED' && proposal.contacts !== null;

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-1 p-4 shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-text-primary">
            {box === 'received'
              ? `Propuesta de @${proposal.proposer.username}`
              : `Para la oferta de @${proposal.offer.owner.username}`}
          </span>
          <span aria-hidden="true" className="text-text-muted">
            ·
          </span>
          <time
            dateTime={proposal.createdAt}
            className="text-xs text-text-muted"
          >
            {formatDate(proposal.createdAt)}
          </time>
        </div>

        <StatusBadge status={proposal.status} />
      </header>

      <OfferCard
        offer={proposal.offer}
        actions={
          <Link
            to={`/offers/${proposal.offer.id}`}
            className="inline-flex min-h-8 items-center justify-center rounded-md border border-border-default bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan"
          >
            Ver oferta
          </Link>
        }
      />

      {proposal.counterOffer && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-default bg-surface-2/70 px-3.5 py-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="foil">Contraoferta vinculada</Badge>
            <span className="text-text-primary">
              {proposal.counterOffer.offered.quantity}×{' '}
              {proposal.counterOffer.offered.card.code} por{' '}
              {proposal.counterOffer.wanted.quantity}×{' '}
              {proposal.counterOffer.wanted.card.code}
            </span>
          </div>
          <Link
            to={`/offers/${proposal.counterOffer.id}`}
            className="font-medium text-foil-cyan underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan"
          >
            Ver contraoferta
          </Link>
        </div>
      )}

      {proposal.message && (
        <p className="rounded-lg border border-border-subtle bg-bg-base/70 px-3.5 py-2.5 text-sm text-text-secondary">
          “{proposal.message}”
        </p>
      )}

      {showContacts && proposal.contacts && (
        <div className="rounded-xl border-foil p-4">
          <p className="font-display text-sm font-bold text-success-text">
            Trade aceptado — Datos de contacto
          </p>
          <dl className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-md bg-surface-2 px-3 py-2">
              <dt className="text-xs text-text-muted">
                Dueño de la oferta (@{proposal.offer.owner.username})
              </dt>
              <dd className="mt-0.5 font-medium text-text-primary">
                {proposal.contacts.offerOwner ?? 'Sin contacto registrado'}
              </dd>
            </div>
            <div className="rounded-md bg-surface-2 px-3 py-2">
              <dt className="text-xs text-text-muted">
                Proponente (@{proposal.proposer.username})
              </dt>
              <dd className="mt-0.5 font-medium text-text-primary">
                {proposal.contacts.proposer ?? 'Sin contacto registrado'}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {isPending && (
        <footer className="flex flex-wrap justify-end gap-2 border-t border-border-subtle pt-3">
          {box === 'received' ? (
            <>
              <Button
                variant="danger"
                size="sm"
                disabled={busy}
                onClick={() => onReject?.(proposal)}
              >
                Rechazar
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={busy}
                onClick={() => onAccept?.(proposal)}
              >
                Aceptar trade
              </Button>
            </>
          ) : (
            <Button
              variant="danger"
              size="sm"
              loading={busy}
              onClick={() => onCancel?.(proposal)}
            >
              Retirar propuesta
            </Button>
          )}
        </footer>
      )}
    </article>
  );
}
