import { API_ERROR_CODES, MAX_HISTORY_DAYS } from '@app/contracts';

export const PAGES_ERRORS = {
  PAGE_NOT_FOUND: {
    code: API_ERROR_CODES.PAGE_NOT_FOUND,
    message: 'Page not found',
  },
  INVALID_DATE_RANGE: {
    code: API_ERROR_CODES.INVALID_DATE_RANGE,
    message: `Choose a range of at most ${MAX_HISTORY_DAYS} days that starts no later than it ends.`,
  },
} as const;
