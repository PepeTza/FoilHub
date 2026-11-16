import type { User } from '../../domain/entities/user.entity.js';
import type { Username } from '../../domain/value-objects/username.vo.js';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByIds(ids: string[]): Promise<User[]>;
  findByUsername(username: Username): Promise<User | null>;
  /** Insert o update. */
  save(user: User): Promise<void>;
}
