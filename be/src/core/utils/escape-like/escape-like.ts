/**
 * Makes user input match itself literally inside a LIKE/ILIKE pattern: `%`, `_` and
 * the escape character lose their wildcard meaning. Postgres' default escape is `\`.
 */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (character) => `\\${character}`);
}
