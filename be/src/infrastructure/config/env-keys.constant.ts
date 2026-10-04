/**
 * Every environment variable the backend reads, by name.
 *
 * Read through `ConfigService` with one of these keys, never as a string literal,
 * so a rename is one edit and an unused variable is visible here.
 */
export const EnvKeys = {
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  LOG_LEVEL: 'LOG_LEVEL',
  DATABASE_URL: 'DATABASE_URL',
  CRAWL_WORKER_ENABLED: 'CRAWL_WORKER_ENABLED',
  /** Which rank provider serves the API's fills; the `id` of one in `pages.module.ts`. */
  RANK_PROVIDER: 'RANK_PROVIDER',
  /** Only the seed process reads it; validated here so a too-short one fails at boot. */
  SEED_USER_PASSWORD: 'SEED_USER_PASSWORD',
} as const;

export type TEnvKey = (typeof EnvKeys)[keyof typeof EnvKeys];
