import { Navigate, Outlet, useLocation } from 'react-router';
import { Spinner } from '../components/ui';
import { useAuth } from './useAuth';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading && !user) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Spinner size="lg" label="Verificando sesión" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
