import type { Username } from '../value-objects/username.vo.js';

export interface UserProps {
  id: string;
  username: Username;
  passwordHash: string;
  /** Discord/WhatsApp/email. El límite de 100 caracteres lo valida el DTO (capa 3). */
  contactInfo: string | null;
  createdAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): User {
    return new User({
      ...props,
      contactInfo: normalizeOptionalText(props.contactInfo),
    });
  }

  static restore(props: UserProps): User {
    return new User({ ...props });
  }

  get id(): string {
    return this.props.id;
  }
  get username(): Username {
    return this.props.username;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get contactInfo(): string | null {
    return this.props.contactInfo;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}

export function normalizeOptionalText(
  text: string | null | undefined,
): string | null {
  const trimmed = text?.trim();
  return trimmed ? trimmed : null;
}
