import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../business-exception/business.exception';

/**
 * A state the code's own invariants say cannot happen — a 500-class fault, never
 * the client's.
 *
 * Not for user-input errors (declare a 4xx with `createException`) and not for
 * operational failures such as a network timeout. The `detail` is kept for logs;
 * the exception filter masks every 5xx body to a generic message.
 */
export class InvariantViolationException extends BusinessException {
  constructor(detail: string, context?: Record<string, unknown>) {
    super(
      { code: 'INVARIANT_VIOLATION', message: detail },
      HttpStatus.INTERNAL_SERVER_ERROR,
      context,
    );
  }
}
