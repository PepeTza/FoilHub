import { useParams } from 'react-router';
import { Badge, EmptyState } from '../components/ui';

export function OfferDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Detalle de oferta
        </h1>
        <Badge variant="info">{id ?? 'sin identificador'}</Badge>
      </header>

      <EmptyState
        title="Detalle y propuestas en construcción"
        description="La vista completa de la oferta y el formulario de propuesta se implementan en las tareas B7 y B8."
      />
    </section>
  );
}
