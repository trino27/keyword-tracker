import type { Provider } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { SecureExceptionsFilter } from '../filters/secure-exceptions/secure-exceptions.filter';
import { createGlobalValidationPipe } from '../utils/validation/global-validation-pipe.factory';

/**
 * The app-wide declarative globals, spread into `AppModule.providers`.
 *
 * One array rather than inline providers so an e2e harness can register the SAME
 * list against a small test module — a hand-copied list stops covering any global
 * added later, and nothing would say so.
 */
export const APP_GLOBAL_PROVIDERS: Provider[] = [
  { provide: APP_PIPE, useFactory: createGlobalValidationPipe },
  { provide: APP_FILTER, useClass: SecureExceptionsFilter },
];
