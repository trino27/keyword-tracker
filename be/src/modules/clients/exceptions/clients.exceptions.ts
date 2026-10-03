import { HttpStatus } from '@nestjs/common';
import { createException } from '@core/exceptions/create-exception/create-exception.util';
import { CLIENTS_ERRORS } from '../constants/clients-errors.constant';

export const InvalidWebsiteUrlException = createException(
  CLIENTS_ERRORS.INVALID_WEBSITE_URL,
  HttpStatus.BAD_REQUEST,
);

export const ClientAlreadyExistsException = createException(
  CLIENTS_ERRORS.CLIENT_ALREADY_EXISTS,
  HttpStatus.CONFLICT,
);

/** Missing AND foreign: the same answer, so ids cannot be probed. */
export const ClientNotFoundException = createException(
  CLIENTS_ERRORS.CLIENT_NOT_FOUND,
  HttpStatus.NOT_FOUND,
);

export const CrawlAlreadyActiveException = createException(
  CLIENTS_ERRORS.CRAWL_ALREADY_ACTIVE,
  HttpStatus.CONFLICT,
);

/** Missing AND foreign, like ClientNotFoundException. */
export const CrawlRunNotFoundException = createException(
  CLIENTS_ERRORS.CRAWL_RUN_NOT_FOUND,
  HttpStatus.NOT_FOUND,
);
