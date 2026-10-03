import { customType } from 'drizzle-orm/pg-core';

/**
 * A `bytea` column carried as a Node Buffer. drizzle-orm 0.45 has no built-in for it;
 * `pg` already returns bytea as a Buffer, so no conversion is needed either way.
 */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => 'bytea',
});

export const byteaColumn = (name: string) => bytea(name);
