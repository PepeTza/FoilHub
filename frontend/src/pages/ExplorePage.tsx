import { Link } from 'react-router';

export function ExplorePage() {
  return (
    <section>
      <h1>Explorar ofertas</h1>
      <p>
        Aquí podrás buscar y filtrar ofertas abiertas de cartas del Digimon Card Game (se implementa
        en la tarea B7).
      </p>
      <p>
        Ejemplo de enlace a detalle: <Link to="/offers/demo-offer-1">Ver oferta de ejemplo</Link>
      </p>
    </section>
  );
}
