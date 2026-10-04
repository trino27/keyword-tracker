import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { API_ERROR_CODES, type TApiErrorCode } from '@app/contracts';
import { BusinessException } from '../../exceptions/business-exception/business.exception';

export interface IErrorResponseBody {
  errorCode: string;
  message: string | string[];
}

/**
 * The codes Nest produces itself, as `@app/contracts` declares them. `HttpStatus[status]`
 * would be shorter, but it invents a code for every status Nest can raise — a route miss
 * answered `NOT_FOUND` before that name existed on either side, and a status outside the
 * enum answered `undefined`, which drops out of the JSON body entirely. Anything not
 * named here is, from the client's side, a request it got wrong.
 */
const NEST_ERROR_CODES: Record<number, TApiErrorCode> = {
  [HttpStatus.BAD_REQUEST]: API_ERROR_CODES.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: API_ERROR_CODES.SESSION_REQUIRED,
  [HttpStatus.NOT_FOUND]: API_ERROR_CODES.NOT_FOUND,
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: API_ERROR_CODES.JSON_REQUIRED,
  [HttpStatus.TOO_MANY_REQUESTS]: API_ERROR_CODES.TOO_MANY_REQUESTS,
};

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
    return {
      errorCode:
        NEST_ERROR_CODES[exception.getStatus()] ?? API_ERROR_CODES.BAD_REQUEST,
      message,
    };
  }
}
