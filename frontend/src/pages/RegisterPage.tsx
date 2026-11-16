import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import {
  validateContactInfo,
  validatePassword,
  validateUsername,
} from '../auth/validation';
import { Button, TextField, useToast } from '../components/ui';

export function RegisterPage() {
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    contactInfo?: string;
  }>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      return;
    }

    setErrors({});
    showToast({
      variant: 'info',
      title: 'Validación correcta',
      description:
        'La conexión con POST /api/auth/register se habilita en la tarea B6.',
    });
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

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <TextField
            label="Nombre de usuario"
            name="username"
            autoComplete="username"
            placeholder="ej. matt_ishida"
            helperText="Entre 3 y 20 caracteres: letras, números o guion bajo."
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
            value={contactInfo}
            error={errors.contactInfo}
            onChange={(event) => setContactInfo(event.target.value)}
          />

          <Button type="submit" fullWidth className="mt-1">
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
