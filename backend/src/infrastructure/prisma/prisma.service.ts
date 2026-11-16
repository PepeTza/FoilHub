import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { readSecret } from '../config/read-secret.js';

/** Resuelve DATABASE_URL o la arma desde DB_* + readSecret('DB_PASSWORD') (para docker exec). */
export function resolveDatabaseUrl(
  env: NodeJS.ProcessEnv = process.env,
): string {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  const host = env.DB_HOST;
  const user = env.DB_USER;
  const name = env.DB_NAME;
  if (host && user && name) {
    const port = env.DB_PORT || '5432';
    const password = readSecret('DB_PASSWORD', env);
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(name)}?schema=public`;
  }

  throw new Error(
    'Falta DATABASE_URL o la configuración DB_HOST, DB_USER, DB_NAME y DB_PASSWORD(_FILE)',
  );
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: resolveDatabaseUrl() }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
