import { useParams } from 'react-router';

export function OfferDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <section>
      <h1>Detalle de oferta</h1>
      <p>Oferta seleccionada: {id ?? 'sin identificador'}</p>
      <p>
        El detalle completo y las acciones de propuesta se implementan en las tareas B7 y B8.
      </p>
    </section>
  );
}
