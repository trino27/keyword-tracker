import { assertTestDatabase } from './assert-test-database/assert-test-database';

/**
 * Runs before every database test file is imported (Jest `setupFiles`).
 *
 * The application reads DATABASE_URL, so it is pointed at the guarded test database
 * here — before any module that builds a pool or a logger is loaded.
 */
process.env.DATABASE_URL = assertTestDatabase(process.env.TEST_DATABASE_URL);
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL ??= 'silent';
