import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * The base of every error a client is meant to read.
 *
 * The wire body is `{ errorCode, message }` and nothing else. `context` carries
 * identifiers and expected/actual values for the LOG only — the exception filter
 * binds it to the log line and never sends it, so internal ids do not leak.
 */
export class BusinessException extends HttpException {
  public readonly context?: Record<string, unknown>;

  constructor(
    errorConfig: { code: string; message: string },
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    context?: Record<string, unknown>,
  ) {
    super(
      { errorCode: errorConfig.code, message: errorConfig.message },
      status,
    );
    this.context = context;
  }
}
