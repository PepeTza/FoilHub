import type { OfferStatus, ProposalStatus } from '../../api/types';

export type TradingStatus = OfferStatus | ProposalStatus;

export interface StatusBadgeProps {
  status: TradingStatus;
}

const STATUS_META: Readonly<Record<TradingStatus, { label: string; classes: string }>> = {
  OPEN: {
    label: 'Abierta',
    classes: 'bg-status-open-bg border-status-open-border text-status-open-text',
  },
  PENDING: {
    label: 'Pendiente',
    classes: 'bg-status-pending-bg border-status-pending-border text-status-pending-text',
  },
  COMPLETED: {
    label: 'Completada',
    classes: 'bg-status-completed-bg border-status-completed-border text-status-completed-text',
  },
  ACCEPTED: {
    label: 'Aceptada',
    classes: 'bg-status-accepted-bg border-status-accepted-border text-status-accepted-text',
  },
  REJECTED: {
    label: 'Rechazada',
    classes: 'bg-status-rejected-bg border-status-rejected-border text-status-rejected-text',
  },
  CANCELLED: {
    label: 'Cancelada',
    classes: 'bg-status-cancelled-bg border-status-cancelled-border text-status-cancelled-text',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const meta = STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-none whitespace-nowrap ${meta.classes}`}
    >
      {meta.label}
    </span>
  );
}
