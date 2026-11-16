import { User } from '../../../domain/entities/user.entity.js';
import { Username } from '../../../domain/value-objects/username.vo.js';
import type { User as UserRow } from '../../../generated/prisma/client.js';

export const UserMapper = {
  toDomain(row: UserRow): User {
    return User.restore({
      id: row.id,
      username: Username.restore(row.username),
      passwordHash: row.passwordHash,
      contactInfo: row.contactInfo,
      createdAt: row.createdAt,
    });
  },

  toPersistence(user: User): UserRow {
    return {
      id: user.id,
      username: user.username.value,
      passwordHash: user.passwordHash,
      contactInfo: user.contactInfo,
      createdAt: user.createdAt,
    };
  },
};
