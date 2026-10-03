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
} as const;

export type TEnvKey = (typeof EnvKeys)[keyof typeof EnvKeys];
