import { ValidationPipe } from '@nestjs/common';

/**
 * The one validation pipe every route runs through.
 *
 * `whitelist` + `forbidNonWhitelisted`: a field the DTO does not declare is a 400,
 * not silently dropped — a client sending `userId` in a body learns at once that
 * ownership is never taken from the request. `transform` turns query strings into
 * the DTO's declared types.
 */
export const createGlobalValidationPipe = (): ValidationPipe =>
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
