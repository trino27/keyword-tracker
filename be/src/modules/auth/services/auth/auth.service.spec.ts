import type { SessionsRepository } from '../../repositories/sessions/sessions.repository';
import type { UsersRepository } from '../../repositories/users/users.repository';
import { hashSessionToken } from '../session-token/session-token';
import { AuthService } from './auth.service';

const NOW = new Date('2026-10-03T12:00:00.000Z');
const USER = {
  id: 7,
  email: 'manager@example.com',
  passwordHash: 'scrypt$131072$8$1$c2FsdA$aGFzaA',
  timeZone: 'America/Toronto',
};

const makeService = () => {
  const users = { findByEmail: jest.fn() };
  const sessions = {
    create: jest.fn(),
    deleteExpired: jest.fn(),
    findLiveByTokenHash: jest.fn(),
    touch: jest.fn(),
    deleteByTokenHash: jest.fn(),
  };
  const hasher = {
    hash: jest.fn().mockResolvedValue('scrypt$131072$8$1$ZHVtbXk$ZHVtbXk'),
    verify: jest.fn(),
  };
  const service = new AuthService(
    users as unknown as UsersRepository,
    sessions as unknown as SessionsRepository,
    hasher,
  );
  return { service, users, sessions, hasher };
};

describe('AuthService', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('signIn', () => {
    it('verifies against the dummy hash when the user is unknown, so timing reveals nothing', async () => {
      const { service, users, hasher } = makeService();
      users.findByEmail.mockResolvedValue(null);
      hasher.verify.mockResolvedValue(false);

      await expect(
        service.signIn('nobody@example.com', 'x'),
      ).rejects.toMatchObject({
        response: { errorCode: 'INVALID_CREDENTIALS' },
      });
      expect(hasher.verify).toHaveBeenCalledWith(
        'x',
        'scrypt$131072$8$1$ZHVtbXk$ZHVtbXk',
      );
    });

    it('looks the email up lower-cased and trimmed', async () => {
      const { service, users, hasher } = makeService();
      users.findByEmail.mockResolvedValue(USER);
      hasher.verify.mockResolvedValue(true);

      await service.signIn('  Manager@Example.COM ', 'pw');

      expect(users.findByEmail).toHaveBeenCalledWith('manager@example.com');
    });

    it('purges expired sessions on login and stores only the token hash', async () => {
      const { service, users, sessions, hasher } = makeService();
      users.findByEmail.mockResolvedValue(USER);
      hasher.verify.mockResolvedValue(true);

      const result = await service.signIn('manager@example.com', 'pw');

      expect(sessions.deleteExpired).toHaveBeenCalledWith(NOW);
      expect(sessions.create).toHaveBeenCalledWith({
        userId: 7,
        tokenHash: hashSessionToken(result.token),
        expiresAt: new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000),
      });
      expect(result.user).toEqual({
        id: 7,
        email: 'manager@example.com',
        timeZone: 'America/Toronto',
      });
    });

    it('refuses a wrong password with the same error as an unknown email', async () => {
      const { service, users, hasher, sessions } = makeService();
      users.findByEmail.mockResolvedValue(USER);
      hasher.verify.mockResolvedValue(false);

      await expect(
        service.signIn('manager@example.com', 'bad'),
      ).rejects.toMatchObject({
        response: { errorCode: 'INVALID_CREDENTIALS' },
      });
      expect(sessions.create).not.toHaveBeenCalled();
    });
  });

  describe('resolveSession', () => {
    const live = (secondsSinceSeen: number) => ({
      id: 3,
      expiresAt: new Date(NOW.getTime() + 60 * 60 * 1000),
      lastSeenAt: new Date(NOW.getTime() - secondsSinceSeen * 1000),
      user: { id: 7, email: USER.email, timeZone: USER.timeZone },
    });

    it('answers null for an unknown or expired token', async () => {
      const { service, sessions } = makeService();
      sessions.findLiveByTokenHash.mockResolvedValue(null);

      await expect(service.resolveSession('token')).resolves.toBeNull();
    });

    it('does not slide the expiry within the touch interval', async () => {
      const { service, sessions } = makeService();
      sessions.findLiveByTokenHash.mockResolvedValue(live(30));

      const resolved = await service.resolveSession('token');

      expect(resolved?.slid).toBe(false);
      expect(sessions.touch).not.toHaveBeenCalled();
    });

    it('slides the expiry to now + 7 days once the touch interval has passed', async () => {
      const { service, sessions } = makeService();
      sessions.findLiveByTokenHash.mockResolvedValue(live(61));

      const resolved = await service.resolveSession('token');

      const expiresAt = new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000);
      expect(sessions.touch).toHaveBeenCalledWith(3, expiresAt, NOW);
      expect(resolved).toEqual({
        user: { id: 7, email: USER.email, timeZone: USER.timeZone },
        expiresAt,
        slid: true,
      });
    });
  });
});
