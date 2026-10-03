import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { BusinessException } from '../../exceptions/business-exception/business.exception';

export interface IErrorResponseBody {
  errorCode: string;
  message: string | string[];
}

const INTERNAL_ERROR_BODY: IErrorResponseBody = {
  errorCode: 'INTERNAL_ERROR',
  message: 'Internal server error',
};

/**
 * Every error leaves the server as `{ errorCode, message }`.
 *
 * - A 4xx keeps its message: it is addressed to the client and the client can act on it.
 * - A 5xx is masked to a generic body whatever threw it. Its detail goes to the log,
 *   with `BusinessException.context` bound, and never to the wire — a stack trace or a
 *   SQL fragment in a response is a description of the system to whoever asked.
 */
@Catch()
export class SecureExceptionsFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(SecureExceptionsFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const context =
      exception instanceof BusinessException ? exception.context : undefined;

    if (status >= 500) {
      this.logger.error({ err: exception, ...context }, 'Request failed');
      response.status(status).json(INTERNAL_ERROR_BODY);
      return;
    }

    this.logger.warn({ err: exception, ...context }, 'Request rejected');
    response.status(status).json(this.clientBody(exception as HttpException));
  }

  private clientBody(exception: HttpException): IErrorResponseBody {
    const body = exception.getResponse();
    if (typeof body === 'object' && body !== null && 'errorCode' in body) {
      return body as IErrorResponseBody;
    }
    // A Nest built-in (ValidationPipe's 400, a guard's 401/403, a 404 route miss).
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? (body as { message: string | string[] }).message
        : exception.message;
    return { errorCode: HttpStatus[exception.getStatus()], message };
  }
}
