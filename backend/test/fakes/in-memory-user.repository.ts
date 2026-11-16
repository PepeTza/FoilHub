import type { UserRepository } from '../../src/application/ports/user-repository.port.js';
import type { User } from '../../src/domain/entities/user.entity.js';
import type { Username } from '../../src/domain/value-objects/username.vo.js';
import { cloneUser, InMemoryStore } from './clone.js';

export class InMemoryUserRepository
  extends InMemoryStore<User>
  implements UserRepository
{
  constructor() {
    super(cloneUser);
  }

  async findById(id: string): Promise<User | null> {
    return this.get(id);
  }

  async findByIds(ids: string[]): Promise<User[]> {
    return this.all().filter((u) => ids.includes(u.id));
  }

  async findByUsername(username: Username): Promise<User | null> {
    return this.all().find((u) => u.username.equals(username)) ?? null;
  }

  async save(user: User): Promise<void> {
    this.put(user);
  }
}
