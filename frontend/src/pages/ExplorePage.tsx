import { Link } from 'react-router';
import { EmptyState } from '../components/ui';

export function ExplorePage() {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Explorar ofertas
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Busca ofertas abiertas por carta ofrecida o buscada.
          </p>
        </div>
      </header>

      <EmptyState
        title="Exploración de ofertas en construcción"
        description="Esta pantalla se conecta con GET /api/offers en la tarea B7."
        action={
          <Link
            to="/offers/demo-offer-1"
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-border-default bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan"
          >
            Ver detalle de ejemplo
          </Link>
        }
      />
    </section>
  );
}
