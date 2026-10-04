/**
 * The largest row id a request may name. Ids are Postgres `bigint` read as JS numbers,
 * so beyond `MAX_SAFE_INTEGER` a number can no longer stand for one row — and a value
 * past the column's range makes Postgres reject the statement itself, which would
 * surface as a 500 for what is really a malformed id.
 */
export const MAX_ID = Number.MAX_SAFE_INTEGER;
