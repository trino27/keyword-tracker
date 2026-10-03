/**
 * Login attempts per IP + email: 10 a minute. Keyed by the pair so one attacker
 * cannot lock a user out from every network, and one network cannot try every email.
 */
export const LOGIN_THROTTLE = {
  name: 'login',
  ttl: 60_000,
  limit: 10,
} as const;
