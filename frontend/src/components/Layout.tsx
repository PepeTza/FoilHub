import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../auth/useAuth';

export function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const appVersion = import.meta.env.VITE_APP_VERSION ?? 'dev';

  return (
    <div className="app-shell">
      <header className="app-header">
        <nav className="app-nav" aria-label="Navegación principal">
          <NavLink to="/" className="app-brand">
            FoilHub
          </NavLink>

          <div className="app-links">
            <NavLink to="/" end className="app-link">
              Explorar
            </NavLink>
            <NavLink to="/offers/new" className="app-link">
              Crear oferta
            </NavLink>
            <NavLink to="/offers/mine" className="app-link">
              Mis ofertas
            </NavLink>
            <NavLink to="/proposals" className="app-link">
              Propuestas
            </NavLink>
            {import.meta.env.DEV && (
              <NavLink to="/_ui" className="app-link">
                Catálogo UI
              </NavLink>
            )}
          </div>

          <div className="app-links">
            {isAuthenticated && user ? (
              <>
                <span>@{user.username}</span>
                <button type="button" className="btn" onClick={logout}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="app-link">
                  Iniciar sesión
                </NavLink>
                <NavLink to="/register" className="app-link">
                  Registrarse
                </NavLink>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        FoilHub — Intercambio de cartas Digimon · versión {appVersion}
      </footer>
    </div>
  );
}
