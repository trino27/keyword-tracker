import { z } from 'zod';
import { EnvKeys } from '../env-keys.constant';

/**
 * Startup environment validation, wired into `ConfigModule.forRoot({ validate })`.
 *
 * A missing or malformed variable aborts boot with one aggregated message instead
 * of surfacing later as a driver error (a broken DATABASE_URL) or a silent
 * `undefined` far from startup.
 *
 * A GATE, not a transform: on success the ORIGINAL config is returned untouched,
 * so `ConfigService.get(...)` yields the same strings it would without this file,
 * and variables not modelled here pass through.
 */

const K = EnvKeys;

/** Protocol-agnostic: `postgresql://` passes, a value with no scheme does not. */
const urlLike = (message: string) =>
  z.string().refine((value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }, message);

export const envSchema = z.object({
  [K.DATABASE_URL]: urlLike(
    'DATABASE_URL must be a valid connection URL (e.g. postgresql://…)',
  ),
  [K.NODE_ENV]: z.enum(['development', 'production', 'test']).optional(),
  [K.PORT]: z
    .string()
    .regex(/^\d+$/, 'PORT must be a positive integer')
    .optional(),
  // "true" starts the crawl worker in this process; anything else leaves runs queued.
  [K.CRAWL_WORKER_ENABLED]: z.enum(['true', 'false']).optional(),
  [K.LOG_LEVEL]: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .optional(),
});

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  return config;
}
