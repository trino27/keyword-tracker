import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { AuthService } from '../../services/auth/auth.service';
import { SessionGuard } from './session.guard';

const USER = {
  id: 7,
  email: 'manager@example.com',
  timeZone: 'America/Toronto',
};

const makeContext = (cookies: Record<string, string>, secure = false) => {
  const request: Record<string, unknown> = { cookies, secure };
  const response = { cookie: jest.fn() };
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
  return { context, request, response };
};

const makeGuard = (isPublic: boolean, resolved: unknown) => {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(isPublic) };
  const auth = { resolveSession: jest.fn().mockResolvedValue(resolved) };
  const guard = new SessionGuard(
    reflector as unknown as Reflector,
    auth as unknown as AuthService,
  );
  return { guard, auth };
};

describe('SessionGuard', () => {
  it('lets a @Public route through without looking at the cookie', async () => {
    const { guard, auth } = makeGuard(true, null);
    const { context } = makeContext({});

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(auth.resolveSession).not.toHaveBeenCalled();
  });

  it('refuses a request without a session cookie with SESSION_REQUIRED', async () => {
    const { guard } = makeGuard(false, null);
    const { context } = makeContext({});

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      response: { errorCode: 'SESSION_REQUIRED' },
    });
  });

  it('refuses a cookie the service does not recognise', async () => {
    const { guard } = makeGuard(false, null);
    const { context } = makeContext({ sid: 'stale' });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      response: { errorCode: 'SESSION_REQUIRED' },
    });
  });

  it('attaches a scope with userId and timeZone, and the session user', async () => {
    const { guard } = makeGuard(false, {
      user: USER,
      expiresAt: new Date(),
      slid: false,
    });
    const { context, request, response } = makeContext({ sid: 'token' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.userScope).toMatchObject({
      userId: 7,
      timeZone: 'America/Toronto',
    });
    expect(request.sessionUser).toEqual(USER);
    expect(response.cookie).not.toHaveBeenCalled();
  });

  it('re-issues the cookie when the expiry slid', async () => {
    const { guard } = makeGuard(false, {
      user: USER,
      expiresAt: new Date(),
      slid: true,
    });
    const { context, response } = makeContext({ sid: 'token' });

    await guard.canActivate(context);

    expect(response.cookie).toHaveBeenCalledWith(
      'sid',
      'token',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
    );
  });
});
