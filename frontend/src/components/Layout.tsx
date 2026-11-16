import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../auth/useAuth';
import { Button, useToast } from './ui';

const NAV_LINKS = [
  { to: '/', label: 'Explorar', end: true },
  { to: '/offers/new', label: 'Crear oferta', end: false },
  { to: '/offers/mine', label: 'Mis ofertas', end: false },
  { to: '/proposals', label: 'Propuestas', end: false },
];

export function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const appVersion = import.meta.env.VITE_APP_VERSION ?? 'dev';

  function handleLogout() {
    logout();
    setMenuOpen(false);
    showToast({ variant: 'info', title: 'Sesión cerrada' });
    void navigate('/login');
  }

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `block rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan ${
      isActive
        ? 'bg-surface-2 text-text-primary border border-border-default'
        : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary border border-transparent'
    }`;

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-bg-base text-text-primary">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-1/95 backdrop-blur-xs">
        <nav
          aria-label="Navegación principal"
          className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3"
        >
          <NavLink
            to="/"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 rounded-md px-1 py-0.5 font-display text-xl font-bold tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan"
          >
            <span className="inline-block h-3 w-3 rounded-xs bg-foil-gradient" aria-hidden="true" />
            <span className="text-foil-gradient">FoilHub</span>
          </NavLink>

          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={linkClasses}
              >
                {item.label}
              </NavLink>
            ))}
            {import.meta.env.DEV && (
              <NavLink to="/_ui" className={linkClasses}>
                Catálogo UI
              </NavLink>
            )}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated && user ? (
              <>
                <span className="rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-sm font-medium text-text-primary">
                  @{user.username}
                </span>
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  Cerrar sesión
                </Button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClasses}>
                  Iniciar sesión
                </NavLink>
                <NavLink
                  to="/register"
                  className="inline-flex min-h-9 items-center justify-center rounded-md bg-foil-gradient px-3.5 py-1.5 text-sm font-semibold text-text-inverse shadow-foil transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
                >
                  Registrarse
                </NavLink>
              </>
            )}
          </div>

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border-default bg-surface-2 text-text-primary hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan md:hidden"
          >
            <span aria-hidden="true" className="font-display text-lg leading-none">
              {menuOpen ? '✕' : '☰'}
            </span>
          </button>
        </nav>

        {menuOpen && (
          <div
            id="mobile-menu"
            className="border-t border-border-subtle bg-surface-1 px-4 py-3 md:hidden"
          >
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={linkClasses}
                >
                  {item.label}
                </NavLink>
              ))}
              {import.meta.env.DEV && (
                <NavLink
                  to="/_ui"
                  onClick={() => setMenuOpen(false)}
                  className={linkClasses}
                >
                  Catálogo UI
                </NavLink>
              )}
            </div>

            <div className="mt-3 flex flex-col gap-2 border-t border-border-subtle pt-3">
              {isAuthenticated && user ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text-primary">
                    @{user.username}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleLogout}
                  >
                    Cerrar sesión
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <NavLink
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className={linkClasses}
                  >
                    Iniciar sesión
                  </NavLink>
                  <NavLink
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex min-h-10 items-center justify-center rounded-md bg-foil-gradient px-4 py-2 text-sm font-semibold text-text-inverse shadow-foil focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan"
                  >
                    Registrarse
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-border-subtle bg-surface-1 px-4 py-4 text-center text-xs text-text-muted">
        FoilHub — Intercambio de cartas Digimon · versión {appVersion}
      </footer>
    </div>
  );
}
