import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { validatePassword, validateUsername } from '../auth/validation';
import { Button, TextField, useToast } from '../components/ui';

export function LoginPage() {
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);

    if (usernameError || passwordError) {
      setErrors({
        username: usernameError ?? undefined,
        password: passwordError ?? undefined,
      });
      return;
    }

    setErrors({});
    showToast({
      variant: 'info',
      title: 'Validación correcta',
      description:
        'La conexión con POST /api/auth/login se habilita en la tarea B6.',
    });
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

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <TextField
            label="Nombre de usuario"
            name="username"
            autoComplete="username"
            placeholder="ej. tai_kamiya"
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
            value={password}
            error={errors.password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <Button type="submit" fullWidth className="mt-1">
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
