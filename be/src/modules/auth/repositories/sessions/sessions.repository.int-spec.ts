import { eq } from 'drizzle-orm';
import { sessions } from '@persistence/schema/tables/sessions/sessions.schema';
import { users } from '@persistence/schema/tables/users/users.schema';
import { createTestDatabase } from '../../../../../test/support/test-database';
import { SessionsRepository } from './sessions.repository';

const testDb = createTestDatabase();
const repository = new SessionsRepository(testDb.db);

const NOW = new Date('2026-10-03T12:00:00.000Z');
const HOUR = 60 * 60 * 1000;

async function seedUser(): Promise<number> {
  const [user] = await testDb.db
    .insert(users)
    .values({
      email: 'manager@example.com',
      passwordHash: 'scrypt$1024$8$1$c2FsdA$aGFzaA',
      timeZone: 'America/Toronto',
    })
    .returning({ id: users.id });
  return user.id;
}

const tokenHash = (seed: number) => Buffer.alloc(32, seed);

describe('SessionsRepository (postgres)', () => {
  beforeEach(() => testDb.reset());
  afterAll(() => testDb.close());

  it('deleting a user cascades its sessions', async () => {
    const userId = await seedUser();
    await repository.create({
      userId,
      tokenHash: tokenHash(1),
      expiresAt: new Date(NOW.getTime() + HOUR),
    });

    await testDb.db.delete(users).where(eq(users.id, userId));

    await expect(testDb.db.select().from(sessions)).resolves.toHaveLength(0);
  });

  it('deleteExpired removes only expired rows', async () => {
    const userId = await seedUser();
    await repository.create({
      userId,
      tokenHash: tokenHash(1),
      expiresAt: new Date(NOW.getTime() - HOUR),
    });
    await repository.create({
      userId,
      tokenHash: tokenHash(2),
      expiresAt: new Date(NOW.getTime() + HOUR),
    });

    await repository.deleteExpired(NOW);

    const left = await testDb.db.select().from(sessions);
    expect(left.map((s) => s.tokenHash)).toEqual([tokenHash(2)]);
  });

  it('finds a live session with its user, and ignores an expired one', async () => {
    const userId = await seedUser();
    await repository.create({
      userId,
      tokenHash: tokenHash(1),
      expiresAt: new Date(NOW.getTime() + HOUR),
    });
    await repository.create({
      userId,
      tokenHash: tokenHash(2),
      expiresAt: new Date(NOW.getTime() - HOUR),
    });

    const live = await repository.findLiveByTokenHash(tokenHash(1), NOW);
    expect(live?.user).toMatchObject({
      id: userId,
      email: 'manager@example.com',
      timeZone: 'America/Toronto',
    });
    await expect(
      repository.findLiveByTokenHash(tokenHash(2), NOW),
    ).resolves.toBeNull();
  });

  it('deleteByTokenHash removes exactly that session', async () => {
    const userId = await seedUser();
    await repository.create({
      userId,
      tokenHash: tokenHash(1),
      expiresAt: new Date(NOW.getTime() + HOUR),
    });
    await repository.create({
      userId,
      tokenHash: tokenHash(2),
      expiresAt: new Date(NOW.getTime() + HOUR),
    });

    await repository.deleteByTokenHash(tokenHash(1));

    const left = await testDb.db.select().from(sessions);
    expect(left.map((s) => s.tokenHash)).toEqual([tokenHash(2)]);
  });
});
