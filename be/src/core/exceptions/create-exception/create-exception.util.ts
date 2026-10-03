import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../business-exception/business.exception';

/**
 * Declares a domain exception class from an error-catalog entry:
 *
 *   export const ClientAlreadyExistsException = createException(
 *     ClientErrors.ALREADY_EXISTS,
 *     HttpStatus.CONFLICT,
 *   );
 *   throw new ClientAlreadyExistsException({ userId, websiteUrl });
 */
export function createException(
  errorConfig: { code: string; message: string },
  status: HttpStatus,
): new (context?: Record<string, unknown>) => BusinessException {
  return class extends BusinessException {
    constructor(context?: Record<string, unknown>) {
      super(errorConfig, status, context);
    }
  };
}
