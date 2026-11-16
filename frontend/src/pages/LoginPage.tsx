import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { validatePassword, validateUsername } from '../auth/validation';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [notice, setNotice] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);

    if (usernameError || passwordError) {
      setErrors({
        username: usernameError ?? undefined,
        password: passwordError ?? undefined,
      });
      setNotice(null);
      return;
    }

    setErrors({});
    setNotice(
      'Validación correcta. La conexión con POST /api/auth/login se habilita en la tarea B6.',
    );
  }

  return (
    <section className="form-card">
      <h1>Iniciar sesión</h1>

      {notice && (
        <p className="form-notice" role="status">
          {notice}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="login-username">Nombre de usuario</label>
          <input
            id="login-username"
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
          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            name="password"
            type="password"
            className="form-input"
            autoComplete="current-password"
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

        <button type="submit" className="btn">
          Entrar
        </button>
      </form>

      <p>
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </section>
  );
}
