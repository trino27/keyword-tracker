interface IPgError {
  code?: string;
  /** Set by a constraint violation (23503, 23505, 23514, …). */
  constraint?: string;
  /** Set by a NOT NULL violation (23502), which names a column and no constraint. */
  column?: string;
}

/**
 * Asserts that a database call was refused by a specific constraint.
 *
 * Drizzle wraps the driver's error, so the Postgres error is looked for on the error
 * itself and on its `cause`. Asserting the constraint NAME — or, for a NOT NULL
 * violation, the COLUMN name, which is all Postgres reports — rather than just "it
 * threw", is what proves the schema and not some other failure refused the write.
 */
export async function expectPgError(
  promise: Promise<unknown>,
  expected: { code: string } & ({ constraint: string } | { column: string }),
): Promise<void> {
  let caught: unknown;
  try {
    await promise;
  } catch (error: unknown) {
    caught = error;
  }
  if (caught === undefined) {
    const named =
      'constraint' in expected ? expected.constraint : expected.column;
    throw new Error(`Expected ${named} to refuse the write`);
  }

  const candidates = [
    caught,
    (caught as { cause?: unknown }).cause,
  ] as IPgError[];
  const pgError = candidates.find((e) => e && typeof e.code === 'string');
  expect(pgError).toMatchObject(expected);
}
