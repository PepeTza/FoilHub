import type { UserRepository } from '../../../application/ports/user-repository.port.js';
import type { User } from '../../../domain/entities/user.entity.js';
import { UsernameTakenError } from '../../../domain/errors/domain-errors.js';
import type { Username } from '../../../domain/value-objects/username.vo.js';
import { UserMapper } from '../mappers/user.mapper.js';
import { isUniqueViolation, type PrismaDb } from '../prisma-db.js';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaDb) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { id } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    const rows = await this.db.user.findMany({ where: { id: { in: ids } } });
    return rows.map((row) => UserMapper.toDomain(row));
  }

  async findByUsername(username: Username): Promise<User | null> {
    const row = await this.db.user.findUnique({
      where: { username: username.value },
    });
    return row ? UserMapper.toDomain(row) : null;
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    try {
      await this.db.user.upsert({
        where: { id: data.id },
        create: data,
        update: data,
      });
    } catch (error) {
      // Dos registros simultáneos con el mismo username: el índice único es la última barrera.
      if (isUniqueViolation(error)) {
        throw new UsernameTakenError();
      }
      throw error;
    }
  }
}
