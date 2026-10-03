import { users } from '@persistence/schema/tables/users/users.schema';
import { createTestDatabase } from '../../../../../test/support/test-database';
import { expectPgError } from '../../../../../test/support/expect-pg-error';
import { UsersRepository } from './users.repository';

const testDb = createTestDatabase();
const repository = new UsersRepository(testDb.db);

const ACCOUNT = {
  email: 'manager@example.com',
  passwordHash: 'scrypt$1024$8$1$c2FsdA$aGFzaA',
  timeZone: 'America/Toronto',
};

describe('UsersRepository (postgres)', () => {
  beforeEach(() => testDb.reset());
  afterAll(() => testDb.close());

  it('a mixed-case email violates users_email_lowercase', async () => {
    await expectPgError(
      testDb.db
        .insert(users)
        .values({ ...ACCOUNT, email: 'Manager@Example.com' }),
      { code: '23514', constraint: 'users_email_lowercase' },
    );
  });

  it('a duplicate email violates users_email_uq', async () => {
    await testDb.db.insert(users).values(ACCOUNT);

    await expectPgError(testDb.db.insert(users).values(ACCOUNT), {
      code: '23505',
      constraint: 'users_email_uq',
    });
  });

  it('upserts by email: the second call updates the password and the zone', async () => {
    const first = await repository.upsertByEmailForWorker(ACCOUNT);
    const second = await repository.upsertByEmailForWorker({
      ...ACCOUNT,
      passwordHash: 'scrypt$1024$8$1$c2FsdA$bmV3',
      timeZone: 'UTC',
    });

    expect(second.id).toBe(first.id);
    expect(second.passwordHash).toBe('scrypt$1024$8$1$c2FsdA$bmV3');
    expect(second.timeZone).toBe('UTC');
  });

  it('finds a user by email, and answers null for an unknown one', async () => {
    const created = await repository.upsertByEmailForWorker(ACCOUNT);

    await expect(repository.findByEmail(ACCOUNT.email)).resolves.toEqual(
      created,
    );
    await expect(
      repository.findByEmail('nobody@example.com'),
    ).resolves.toBeNull();
  });
});
