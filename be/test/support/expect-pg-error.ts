interface IPgError {
  code?: string;
  constraint?: string;
}

/**
 * Asserts that a database call was refused by a specific constraint.
 *
 * Drizzle wraps the driver's error, so the Postgres error is looked for on the error
 * itself and on its `cause`. Asserting the constraint NAME, not just "it threw", is
 * what proves the schema — and not some other failure — refused the write.
 */
export async function expectPgError(
  promise: Promise<unknown>,
  expected: { code: string; constraint: string },
): Promise<void> {
  let caught: unknown;
  try {
    await promise;
  } catch (error: unknown) {
    caught = error;
  }
  if (caught === undefined) {
    throw new Error(
      `Expected constraint ${expected.constraint} to refuse the write`,
    );
  }

  const candidates = [
    caught,
    (caught as { cause?: unknown }).cause,
  ] as IPgError[];
  const pgError = candidates.find((e) => e && typeof e.code === 'string');
  expect(pgError).toMatchObject(expected);
}
