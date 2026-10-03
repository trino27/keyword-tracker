import type { NextFunction, Request, Response } from 'express';
import { API_ERROR_CODES } from '@app/contracts';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const hasBody = (request: Request): boolean =>
  request.headers['transfer-encoding'] !== undefined ||
  Number(request.headers['content-length'] ?? 0) > 0;

/**
 * A mutating request that carries a body must carry JSON.
 *
 * This is half of the CSRF defence (the other half is SameSite=Lax on the session
 * cookie): a cross-site HTML form can only send form-encoded or text bodies, and those
 * are refused here before any controller runs. A browser can send JSON cross-site only
 * after a CORS preflight, which this API never grants.
 */
export function jsonOnlyMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (!MUTATING_METHODS.has(request.method) || !hasBody(request)) {
    next();
    return;
  }

  const contentType = String(request.headers['content-type'] ?? '');
  const mediaType = contentType.split(';')[0].trim().toLowerCase();
  if (mediaType === 'application/json') {
    next();
    return;
  }

  response.status(415).json({
    errorCode: API_ERROR_CODES.JSON_REQUIRED,
    message: 'Send the request body as application/json.',
  });
}
