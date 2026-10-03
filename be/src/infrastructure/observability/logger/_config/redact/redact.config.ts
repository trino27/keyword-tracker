/**
 * Paths pino masks before a line is written.
 *
 * A session cookie or a password in a request log is a credential in a file
 * nobody thinks of as sensitive. Masked rather than removed, so a reader can
 * still see the field was present.
 */
export const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'password',
  '*.password',
] as const;

export const REDACT_CENSOR = '[REDACTED]';
