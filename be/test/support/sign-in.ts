import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { users } from '../../src/persistence/schema/tables/users/users.schema';
import { PasswordHasher } from '../../src/modules/auth/services/password-hasher/password-hasher.service';
import type { ITestDatabase } from './test-database';

/** Cheap scrypt parameters for seeded test users; production verifies whatever is stored. */
const TEST_SCRYPT = {
  N: 2 ** 10,
  r: 8,
  p: 1,
  saltBytes: 16,
  keyLen: 64,
  maxmem: 32 * 1024 * 1024,
};

export const TEST_PASSWORD = 'correct horse battery staple';

export interface ITestUser {
  id: number;
  email: string;
  timeZone: string;
}

export async function seedTestUser(
  testDb: ITestDatabase,
  email: string,
  timeZone = 'America/Toronto',
): Promise<ITestUser> {
  const passwordHash = await new PasswordHasher().hash(
    TEST_PASSWORD,
    TEST_SCRYPT,
  );
  const [row] = await testDb.db
    .insert(users)
    .values({ email, passwordHash, timeZone })
    .returning({ id: users.id, email: users.email, timeZone: users.timeZone });
  return row;
}

/**
 * Signs a seeded user in and returns the `Cookie` header to send.
 *
 * Asserts the login answered 200 with a cookie: a seeding step whose status nobody
 * checks turns a broken login into a confusing 401 three steps later.
 */
export async function signIn(
  app: NestExpressApplication,
  email: string,
  password = TEST_PASSWORD,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  const cookie = ([] as string[])
    .concat(response.headers['set-cookie'] ?? [])
    .find((value) => value.startsWith('sid='));
  if (!cookie) throw new Error(`login for ${email} set no sid cookie`);
  return cookie.split(';')[0];
}
