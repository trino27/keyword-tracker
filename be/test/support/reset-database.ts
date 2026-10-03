import { Pool } from 'pg';

/**
 * Empties every application table between database tests, so each case starts from
 * a known state and no case depends on the order the suite runs in.
 *
 * Reads the table list from the catalogue rather than a hand-kept array: a table
 * added later is reset without anyone remembering to list it. The migrations journal
 * lives in the `drizzle` schema and is never touched.
 */
export async function resetDatabase(databaseUrl: string): Promise<void> {
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const { rows } = await pool.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
    );
    if (rows.length === 0) return;

    const tables = rows.map(({ tablename }) => `"${tablename}"`).join(', ');
    await pool.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
  } finally {
    await pool.end();
  }
}
