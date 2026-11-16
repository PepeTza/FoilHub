import { defineConfig } from 'vitest/config';

// e2e (*.e2e-spec.ts) e integración (*.int-spec.ts) contra la base foilhub_test.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://foilhub:foilhub_dev@localhost:5432/foilhub_test?schema=public';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts', 'test/**/*.int-spec.ts'],
    env: { DATABASE_URL: TEST_DATABASE_URL },
    globalSetup: ['./test/e2e/global-setup.ts'],
    // Todos los archivos comparten la misma base: uno a la vez.
    fileParallelism: false,
  },
});
