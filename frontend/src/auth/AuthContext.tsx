import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router';
import { getCurrentUser } from '../api/auth';
import {
  ApiError,
  UNAUTHORIZED_EVENT,
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from '../api/client';
import type { UserSummaryDto } from '../api/types';
import { AuthContext, type AuthContextValue } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<UserSummaryDto | null>(() => {
    const storedToken = getStoredToken();
    return storedToken ? getStoredUser() : null;
  });
  const [contactInfo, setContactInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    Boolean(getStoredToken()),
  );

  useEffect(() => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      return;
    }

    let cancelled = false;
    getCurrentUser()
      .then((me) => {
        if (cancelled) {
          return;
        }
        const summary: UserSummaryDto = { id: me.id, username: me.username };
        setStoredUser(summary);
        setUser(summary);
        setContactInfo(me.contactInfo);
      })
      .catch((err: unknown) => {
        // Si fue 401, apiFetch ya limpió el almacenamiento. Si el usuario ya no existe en BD (404),
        // invalidamos también la sesión local para evitar tokens huérfanos tras reiniciar la BD.
        if (!cancelled && err instanceof ApiError && err.statusCode === 404) {
          clearStoredAuth();
          setToken(null);
          setUser(null);
          setContactInfo(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      clearStoredAuth();
      setToken(null);
      setUser(null);
      setContactInfo(null);
      setIsLoading(false);

      if (location.pathname !== '/login') {
        void navigate('/login', {
          replace: true,
          state: { from: location.pathname },
        });
      }
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () =>
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [location.pathname, navigate]);

  const login = useCallback((nextToken: string, nextUser: UserSummaryDto) => {
    setStoredToken(nextToken);
    setStoredUser(nextUser);
    setToken(nextToken);
    setUser(nextUser);
    setIsLoading(false);

    getCurrentUser()
      .then((me) => {
        setContactInfo(me.contactInfo);
      })
      .catch(() => {
        // El login ya es válido aunque /me falle temporalmente.
      });
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
    setContactInfo(null);
    setIsLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      contactInfo,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      logout,
    }),
    [token, user, contactInfo, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
