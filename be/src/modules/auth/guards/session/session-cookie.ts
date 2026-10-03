import type { CookieOptions } from 'express';
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from '../../constants/session.constant';

/**
 * HttpOnly: no script can read the session. SameSite=Lax: a cross-site POST carries no
 * cookie. Secure only over HTTPS — a Secure cookie set over plain HTTP (local docker on
 * :8080) would never be sent back, and the session would not survive a refresh.
 */
export const sessionCookieOptions = (secure: boolean): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure,
  maxAge: SESSION_TTL_MS,
});

export const SESSION_COOKIE = SESSION_COOKIE_NAME;
