import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import { createException } from '../../exceptions/create-exception/create-exception.util';
import { InvariantViolationException } from '../../exceptions/invariant-violation-exception/invariant-violation.exception';
import { SecureExceptionsFilter } from './secure-exceptions.filter';

const makeHost = () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
};

const makeLogger = () =>
  ({ error: jest.fn(), warn: jest.fn() }) as unknown as PinoLogger;

describe('SecureExceptionsFilter', () => {
  const NotFoundThing = createException(
    { code: 'THING_NOT_FOUND', message: 'Thing not found' },
    HttpStatus.NOT_FOUND,
  );

  it('sends a business 4xx as its own code and message, without context', () => {
    const { host, status, json } = makeHost();
    new SecureExceptionsFilter(makeLogger()).catch(
      new NotFoundThing({ thingId: 42 }),
      host,
    );

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      errorCode: 'THING_NOT_FOUND',
      message: 'Thing not found',
    });
  });

  it('masks an invariant violation and logs its detail', () => {
    const { host, status, json } = makeHost();
    const logger = makeLogger();
    new SecureExceptionsFilter(logger).catch(
      new InvariantViolationException('row vanished mid-transaction', {
        id: 1,
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      errorCode: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
      'Request failed',
    );
  });

  it('masks an unknown thrown value as a 500', () => {
    const { host, status, json } = makeHost();
    new SecureExceptionsFilter(makeLogger()).catch(
      new TypeError('x is undefined'),
      host,
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: 'INTERNAL_ERROR' }),
    );
  });

  it('keeps the validation messages of a Nest built-in 400', () => {
    const { host, json } = makeHost();
    new SecureExceptionsFilter(makeLogger()).catch(
      new BadRequestException(['websiteUrl must be a URL']),
      host,
    );

    expect(json).toHaveBeenCalledWith({
      errorCode: 'BAD_REQUEST',
      message: ['websiteUrl must be a URL'],
    });
  });
});
