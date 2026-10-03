import { API_ERROR_CODES } from '@app/contracts';

export const CLIENTS_ERRORS = {
  INVALID_WEBSITE_URL: {
    code: API_ERROR_CODES.INVALID_WEBSITE_URL,
    message: 'Enter a public website address, for example https://example.com',
  },
  CLIENT_ALREADY_EXISTS: {
    code: API_ERROR_CODES.CLIENT_ALREADY_EXISTS,
    message: 'You already track this website',
  },
  CLIENT_NOT_FOUND: {
    code: API_ERROR_CODES.CLIENT_NOT_FOUND,
    message: 'Client not found',
  },
  CRAWL_ALREADY_ACTIVE: {
    code: API_ERROR_CODES.CRAWL_ALREADY_ACTIVE,
    message: 'A crawl of this website is already running',
  },
  CRAWL_RUN_NOT_FOUND: {
    code: API_ERROR_CODES.CRAWL_RUN_NOT_FOUND,
    message: 'Crawl run not found',
  },
} as const;
