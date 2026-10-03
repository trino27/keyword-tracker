interface IPgErrorLike {
  code?: unknown;
  constraint?: unknown;
}

/**
 * The name of the unique index a write violated (Postgres 23505), or undefined.
 *
 * Services translate a known constraint into a domain error ("you already track this
 * site") instead of checking first and inserting second — a check-then-insert is a race
 * two concurrent requests both win. Drizzle wraps the driver error, so `cause` is read too.
 */
export function uniqueViolationConstraint(error: unknown): string | undefined {
  for (const candidate of [error, (error as { cause?: unknown })?.cause]) {
    const pg = candidate as IPgErrorLike | undefined;
    if (pg?.code === '23505' && typeof pg.constraint === 'string') {
      return pg.constraint;
    }
  }
  return undefined;
}
