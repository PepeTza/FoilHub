import { EmptyState } from '../components/ui';

export function ProposalsPage() {
  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Propuestas
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Revisa tus propuestas recibidas y enviadas para aceptar, rechazar o retirar intercambios.
        </p>
      </header>

      <EmptyState
        title="Bandeja de propuestas en construcción"
        description="Las pestañas Recibidas/Enviadas y la revelación de contactos al aceptar se implementan en la tarea B8."
      />
    </section>
  );
}
