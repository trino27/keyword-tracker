import { HttpStatus } from '@nestjs/common';
import { createException } from '@core/exceptions/create-exception/create-exception.util';
import { PAGES_ERRORS } from '../constants/pages-errors.constant';

/** Missing, foreign, or no longer in the client's current crawl — one answer for all. */
export const PageNotFoundException = createException(
  PAGES_ERRORS.PAGE_NOT_FOUND,
  HttpStatus.NOT_FOUND,
);

export const InvalidDateRangeException = createException(
  PAGES_ERRORS.INVALID_DATE_RANGE,
  HttpStatus.BAD_REQUEST,
);
