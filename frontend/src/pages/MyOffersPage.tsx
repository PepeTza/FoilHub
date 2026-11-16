import { EmptyState } from '../components/ui';

export function MyOffersPage() {
  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Mis ofertas
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Administra tus ofertas publicadas y descubre matches automáticos.
        </p>
      </header>

      <EmptyState
        title="Gestión de ofertas en construcción"
        description="El listado personal, filtro por estado y matches se implementan en la tarea B7."
      />
    </section>
  );
}
