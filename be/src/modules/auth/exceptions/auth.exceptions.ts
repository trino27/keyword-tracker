import { HttpStatus } from '@nestjs/common';
import { createException } from '@core/exceptions/create-exception/create-exception.util';
import { AUTH_ERRORS } from '../constants/auth-errors.constant';

export const InvalidCredentialsException = createException(
  AUTH_ERRORS.INVALID_CREDENTIALS,
  HttpStatus.UNAUTHORIZED,
);

export const SessionRequiredException = createException(
  AUTH_ERRORS.SESSION_REQUIRED,
  HttpStatus.UNAUTHORIZED,
);
