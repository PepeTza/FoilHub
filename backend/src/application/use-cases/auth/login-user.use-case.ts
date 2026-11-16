import { InvalidCredentialsError } from '../../../domain/errors/domain-errors.js';
import { Username } from '../../../domain/value-objects/username.vo.js';
import type { PasswordHasher } from '../../ports/password-hasher.port.js';
import type { TokenService } from '../../ports/token-service.port.js';
import type { UserRepository } from '../../ports/user-repository.port.js';
import type { UserSummary } from './auth.types.js';

export interface LoginUserInput {
  username: string;
  password: string;
}

export interface LoginUserOutput {
  accessToken: string;
  user: UserSummary;
}

export class LoginUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  /** Usuario inexistente, username mal formado o clave incorrecta: siempre InvalidCredentialsError. */
  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const username = parseUsername(input.username);
    const user = username ? await this.users.findByUsername(username) : null;
    if (
      !user ||
      !(await this.hasher.verify(input.password, user.passwordHash))
    ) {
      throw new InvalidCredentialsError();
    }

    const accessToken = await this.tokens.sign({
      sub: user.id,
      username: user.username.value,
    });
    return {
      accessToken,
      user: { id: user.id, username: user.username.value },
    };
  }
}

function parseUsername(raw: string): Username | null {
  try {
    return Username.create(raw);
  } catch {
    return null;
  }
}
