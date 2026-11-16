import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { loginUser } from '../api/auth';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { validatePassword, validateUsername } from '../auth/validation';
import { Button, TextField, useToast } from '../components/ui';

interface LoginLocationState {
  from?: string;
  registeredUsername?: string;
}

function readLocationState(state: unknown): LoginLocationState {
  if (typeof state !== 'object' || state === null) {
    return {};
  }
  const record = state as Record<string, unknown>;
  return {
    from: typeof record.from === 'string' ? record.from : undefined,
    registeredUsername:
      typeof record.registeredUsername === 'string'
        ? record.registeredUsername
        : undefined,
  };
}

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = readLocationState(location.state);
  const redirectTarget =
    locationState.from && locationState.from !== '/login'
      ? locationState.from
      : '/';

  const [username, setUsername] = useState(
    () => locationState.registeredUsername ?? '',
  );
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>(
    {},
  );

  if (isAuthenticated) {
    return <Navigate to={redirectTarget} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);

    if (usernameError || passwordError) {
      setErrors({
        username: usernameError ?? undefined,
        password: passwordError ?? undefined,
      });
      setFormError(null);
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const response = await loginUser({ username, password });
      login(response.accessToken, response.user);
      showToast({
        variant: 'success',
        title: `Bienvenido, @${response.user.username}`,
      });
      void navigate(redirectTarget, { replace: true });
    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        'No se pudo iniciar sesión. Intenta de nuevo.',
      );
      setFormError(message);
      showToast({
        variant: 'error',
        title: 'Error al iniciar sesión',
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <section className="rounded-xl border border-border-subtle bg-surface-1 p-6 shadow-card">
        <header className="mb-6">
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Iniciar sesión
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Entra para publicar ofertas y proponer intercambios.
          </p>
        </header>

        {formError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-danger-border bg-danger-bg px-3.5 py-2.5 text-sm text-danger-text"
          >
            {formError}
          </div>
        )}

        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          noValidate
          className="flex flex-col gap-4"
        >
          <TextField
            label="Nombre de usuario"
            name="username"
            autoComplete="username"
            placeholder="ej. tai_kamiya"
            disabled={submitting}
            value={username}
            error={errors.username}
            onChange={(event) => setUsername(event.target.value)}
          />

          <TextField
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Mínimo 8 caracteres"
            disabled={submitting}
            value={password}
            error={errors.password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <Button type="submit" fullWidth loading={submitting} className="mt-1">
            Entrar
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-text-secondary">
          ¿No tienes cuenta?{' '}
          <Link
            to="/register"
            className="font-medium text-foil-cyan underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan"
          >
            Regístrate
          </Link>
        </p>
      </section>
    </div>
  );
}
