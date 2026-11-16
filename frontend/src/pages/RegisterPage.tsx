import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { registerUser } from '../api/auth';
import { ApiError, getErrorMessage } from '../api/client';
import { useAuth } from '../auth/useAuth';
import {
  validateContactInfo,
  validatePassword,
  validateUsername,
} from '../auth/validation';
import { Button, TextField, useToast } from '../components/ui';

export function RegisterPage() {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    contactInfo?: string;
  }>({});

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    const contactError = validateContactInfo(contactInfo);

    if (usernameError || passwordError || contactError) {
      setErrors({
        username: usernameError ?? undefined,
        password: passwordError ?? undefined,
        contactInfo: contactError ?? undefined,
      });
      setFormError(null);
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const created = await registerUser({ username, password, contactInfo });
      showToast({
        variant: 'success',
        title: `Cuenta @${created.username} creada`,
        description: 'Ya puedes iniciar sesión.',
      });
      void navigate('/login', {
        replace: true,
        state: { registeredUsername: created.username },
      });
    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        'No se pudo completar el registro. Intenta de nuevo.',
      );
      if (error instanceof ApiError) {
        if (
          error.error === 'USERNAME_TAKEN' ||
          error.error === 'INVALID_USERNAME'
        ) {
          setErrors({ username: message });
        } else if (error.error === 'WEAK_PASSWORD') {
          setErrors({ password: message });
        }
      }
      setFormError(message);
      showToast({
        variant: 'error',
        title: 'Error al registrarse',
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
            Crear cuenta
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Únete para intercambiar cartas del Digimon Card Game.
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
            placeholder="ej. matt_ishida"
            helperText="Entre 3 y 20 caracteres: letras, números o guion bajo."
            disabled={submitting}
            value={username}
            error={errors.username}
            onChange={(event) => setUsername(event.target.value)}
          />

          <TextField
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Entre 8 y 72 caracteres"
            disabled={submitting}
            value={password}
            error={errors.password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <TextField
            label="Contacto (opcional)"
            name="contactInfo"
            maxLength={100}
            placeholder="Discord, WhatsApp o email"
            helperText="Solo se muestra a la otra persona cuando aceptas o te aceptan un trade."
            disabled={submitting}
            value={contactInfo}
            error={errors.contactInfo}
            onChange={(event) => setContactInfo(event.target.value)}
          />

          <Button type="submit" fullWidth loading={submitting} className="mt-1">
            Registrarse
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-text-secondary">
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="font-medium text-foil-cyan underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foil-cyan"
          >
            Inicia sesión
          </Link>
        </p>
      </section>
    </div>
  );
}
