import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { getErrorMessage } from '../api/client';
import {
  acceptProposal,
  cancelProposal,
  listMyProposals,
  rejectProposal,
  type ProposalBox,
} from '../api/proposals';
import type { ProposalDto, ProposalStatus } from '../api/types';
import {
  EmptyState,
  ErrorState,
  Select,
  Skeleton,
  Tabs,
  useToast,
} from '../components/ui';
import { ProposalCard } from '../features/proposals/ProposalCard';

type StatusFilter = '' | ProposalStatus;

function readInitialBox(state: unknown): ProposalBox {
  if (
    typeof state === 'object' &&
    state !== null &&
    'box' in state &&
    (state.box === 'received' || state.box === 'sent')
  ) {
    return state.box;
  }
  return 'received';
}

export function ProposalsPage() {
  const location = useLocation();
  const { showToast } = useToast();
  const [box, setBox] = useState<ProposalBox>(() =>
    readInitialBox(location.state),
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [proposals, setProposals] = useState<ProposalDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(() => {
    setReloadTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      listMyProposals({
        box,
        status: statusFilter || undefined,
      })
        .then((items) => {
          if (!cancelled) {
            setProposals(items);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(
              getErrorMessage(err, 'No se pudieron cargar las propuestas.'),
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
  }, [box, statusFilter, reloadTick]);

  async function runAction(
    proposal: ProposalDto,
    action: (id: string) => Promise<ProposalDto>,
    successTitle: string,
    successDescription: string,
    errorTitle: string,
  ) {
    setBusyId(proposal.id);
    try {
      const updated = await action(proposal.id);
      setProposals((prev) => {
        if (statusFilter && updated.status !== statusFilter) {
          return prev.filter((item) => item.id !== updated.id);
        }
        return prev.map((item) => (item.id === updated.id ? updated : item));
      });
      showToast({
        variant: 'success',
        title: successTitle,
        description: successDescription,
      });
      // Al aceptar, otras propuestas pendientes de esa oferta pasan a REJECTED en el backend.
      if (updated.status === 'ACCEPTED') {
        reload();
      }
    } catch (err: unknown) {
      const message = getErrorMessage(
        err,
        'No se pudo completar la acción sobre la propuesta.',
      );
      showToast({
        variant: 'error',
        title: errorTitle,
        description: message,
      });
    } finally {
      setBusyId(null);
    }
  }

  function renderContent() {
    if (loading) {
      return (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      );
    }

    if (error) {
      return <ErrorState message={error} onRetry={reload} />;
    }

    if (proposals.length === 0) {
      return (
        <EmptyState
          title={
            box === 'received'
              ? 'No tienes propuestas recibidas'
              : 'No has enviado propuestas todavía'
          }
          description={
            box === 'received'
              ? 'Cuando otros usuarios propongan un trade sobre tus ofertas aparecerán aquí.'
              : 'Explora las ofertas abiertas y propón un intercambio.'
          }
          action={
            box === 'sent' ? (
              <Link
                to="/"
                className="inline-flex min-h-9 items-center justify-center rounded-md bg-foil-gradient px-3.5 py-1.5 text-xs font-semibold text-text-inverse shadow-foil focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan"
              >
                Explorar ofertas
              </Link>
            ) : undefined
          }
        />
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {proposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            box={box}
            busy={busyId === proposal.id}
            onAccept={(item) => {
              void runAction(
                item,
                acceptProposal,
                'Trade aceptado',
                'Ya puedes ver los datos de contacto para coordinar el intercambio.',
                'No se pudo aceptar la propuesta',
              );
            }}
            onReject={(item) => {
              void runAction(
                item,
                rejectProposal,
                'Propuesta rechazada',
                'La oferta sigue abierta para otras propuestas.',
                'No se pudo rechazar la propuesta',
              );
            }}
            onCancel={(item) => {
              void runAction(
                item,
                cancelProposal,
                'Propuesta retirada',
                'Tu propuesta fue cancelada.',
                'No se pudo retirar la propuesta',
              );
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Propuestas
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Acepta o rechaza propuestas sobre tus ofertas, o retira las que enviaste.
          </p>
        </div>

        <div className="w-44">
          <Select
            label="Filtrar por estado"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            options={[
              { value: '', label: 'Todas' },
              { value: 'PENDING', label: 'Pendientes' },
              { value: 'ACCEPTED', label: 'Aceptadas' },
              { value: 'REJECTED', label: 'Rechazadas' },
              { value: 'CANCELLED', label: 'Canceladas' },
            ]}
          />
        </div>
      </header>

      <Tabs
        ariaLabel="Bandeja de propuestas"
        activeTab={box}
        onChange={(nextBox) => setBox(nextBox as ProposalBox)}
        items={[
          {
            id: 'received',
            label: 'Recibidas',
            content: renderContent(),
          },
          {
            id: 'sent',
            label: 'Enviadas',
            content: renderContent(),
          },
        ]}
      />
    </section>
  );
}
