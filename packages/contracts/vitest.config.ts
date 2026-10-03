import { defineConfig } from 'vitest/config';

// Pinned to `src/`: a stale `dist/` must never be collected as a second copy of the suite.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
