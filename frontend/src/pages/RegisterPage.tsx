import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { validateContactInfo, validatePassword, validateUsername } from '../auth/validation';

export function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    contactInfo?: string;
  }>({});
  const [notice, setNotice] = useState<string | null>(null);

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
      setNotice(null);
      return;
    }

    setErrors({});
    setNotice(
      'Validación correcta. La conexión con POST /api/auth/register se habilita en la tarea B6.',
    );
  }

  return (
    <section className="form-card">
      <h1>Crear cuenta</h1>

      {notice && (
        <p className="form-notice" role="status">
          {notice}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="register-username">Nombre de usuario</label>
          <input
            id="register-username"
            name="username"
            type="text"
            className="form-input"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            aria-invalid={Boolean(errors.username)}
          />
          {errors.username && (
            <p className="form-error" role="alert">
              {errors.username}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="register-password">Contraseña</label>
          <input
            id="register-password"
            name="password"
            type="password"
            className="form-input"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password && (
            <p className="form-error" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="register-contact">Contacto (opcional: Discord, WhatsApp o email)</label>
          <input
            id="register-contact"
            name="contactInfo"
            type="text"
            className="form-input"
            maxLength={100}
            value={contactInfo}
            onChange={(event) => setContactInfo(event.target.value)}
            aria-invalid={Boolean(errors.contactInfo)}
          />
          {errors.contactInfo && (
            <p className="form-error" role="alert">
              {errors.contactInfo}
            </p>
          )}
        </div>

        <button type="submit" className="btn">
          Registrarse
        </button>
      </form>

      <p>
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </section>
  );
}
