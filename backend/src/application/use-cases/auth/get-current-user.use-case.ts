import { UserNotFoundError } from '../../../domain/errors/domain-errors.js';
import type { UserRepository } from '../../ports/user-repository.port.js';
import type { CurrentUser } from './auth.types.js';

export interface GetCurrentUserInput {
  /** `sub` del token. */
  userId: string;
}

export class GetCurrentUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: GetCurrentUserInput): Promise<CurrentUser> {
    const user = await this.users.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    return {
      id: user.id,
      username: user.username.value,
      contactInfo: user.contactInfo,
    };
  }
}
