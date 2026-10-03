/**
 * The database tests truncate every table between cases. Pointed at the wrong
 * database they would wipe it, so the runner refuses any database whose name does
 * not end in `_test` — before it connects, migrates or truncates anything.
 */
export function assertTestDatabase(url: string | undefined): string {
  if (!url) {
    throw new Error(
      'TEST_DATABASE_URL is not set. Copy it from .env.example into .env.',
    );
  }

  let databaseName: string;
  try {
    databaseName = decodeURIComponent(new URL(url).pathname.replace(/^\//, ''));
  } catch {
    throw new Error('TEST_DATABASE_URL is not a valid connection URL.');
  }

  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `Refusing to run database tests against "${databaseName}": the database name must end in _test.`,
    );
  }
  return url;
}
