const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export function validateUsername(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'El nombre de usuario es obligatorio.';
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return 'Debe tener entre 3 y 20 caracteres (solo letras, números y guion bajo).';
  }
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) {
    return 'La contraseña es obligatoria.';
  }
  if (value.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (value.length > 72) {
    return 'La contraseña no puede superar los 72 caracteres.';
  }
  return null;
}

export function validateContactInfo(value: string): string | null {
  if (value.trim().length > 100) {
    return 'El contacto no puede superar los 100 caracteres.';
  }
  return null;
}
