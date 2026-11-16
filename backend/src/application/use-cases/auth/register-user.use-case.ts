import { User } from '../../../domain/entities/user.entity.js';
import { UsernameTakenError } from '../../../domain/errors/domain-errors.js';
import { PlainPassword } from '../../../domain/value-objects/plain-password.vo.js';
import { Username } from '../../../domain/value-objects/username.vo.js';
import type { Clock } from '../../ports/clock.port.js';
import type { IdGenerator } from '../../ports/id-generator.port.js';
import type { PasswordHasher } from '../../ports/password-hasher.port.js';
import type { UserRepository } from '../../ports/user-repository.port.js';
import type { UserSummary } from './auth.types.js';

export interface RegisterUserInput {
  username: string;
  password: string;
  contactInfo?: string | null;
}

export class RegisterUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: RegisterUserInput): Promise<UserSummary> {
    const username = Username.create(input.username);
    const password = PlainPassword.create(input.password);

    // Username se guarda en minúsculas: "Ana" y "ana" chocan aquí.
    // Si dos registros llegan a la vez, el índice único de la BD es la última barrera (A4).
    if (await this.users.findByUsername(username)) {
      throw new UsernameTakenError();
    }

    const user = User.create({
      id: this.ids.next(),
      username,
      passwordHash: await this.hasher.hash(password.value),
      contactInfo: input.contactInfo ?? null,
      createdAt: this.clock.now(),
    });
    await this.users.save(user);

    return { id: user.id, username: user.username.value };
  }
}
