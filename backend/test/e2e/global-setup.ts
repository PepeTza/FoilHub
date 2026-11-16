import { execSync } from 'node:child_process';
import { TEST_DATABASE_URL } from '../../vitest.config.e2e.js';

/** Aplica las migraciones a foilhub_test antes de correr e2e e integración. */
export default function setup(): void {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'pipe',
  });
}
