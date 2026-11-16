import { EmptyState } from '../components/ui';

export function CreateOfferPage() {
  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Crear oferta
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Publica qué carta entregas y cuál buscas en el intercambio.
        </p>
      </header>

      <EmptyState
        title="Formulario de nueva oferta en construcción"
        description="El buscador de cartas y la creación de ofertas se habilitan en la tarea B7."
      />
    </section>
  );
}
