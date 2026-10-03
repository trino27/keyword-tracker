/**
 * Every `errorCode` the API can answer with, declared once.
 *
 * The backend builds its exception classes from these keys and the frontend branches
 * only on them, so a code cannot exist on one side and not the other. Codes Nest
 * produces itself (BAD_REQUEST, TOO_MANY_REQUESTS, INTERNAL_ERROR) are listed too:
 * the frontend reads them the same way.
 */
export const API_ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_REQUIRED: 'SESSION_REQUIRED',
  JSON_REQUIRED: 'JSON_REQUIRED',
  INVALID_WEBSITE_URL: 'INVALID_WEBSITE_URL',
  CLIENT_ALREADY_EXISTS: 'CLIENT_ALREADY_EXISTS',
  CLIENT_NOT_FOUND: 'CLIENT_NOT_FOUND',
  CRAWL_ALREADY_ACTIVE: 'CRAWL_ALREADY_ACTIVE',
  CRAWL_RUN_NOT_FOUND: 'CRAWL_RUN_NOT_FOUND',
  PAGE_NOT_FOUND: 'PAGE_NOT_FOUND',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type TApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
