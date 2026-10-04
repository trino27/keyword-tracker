import type { NextFunction, Request, Response } from 'express';
import { API_ERROR_CODES } from '@app/contracts';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * A mutating request must declare JSON — with a body or without one.
 *
 * This is half of the CSRF defence (the other half is SameSite=Lax on the session
 * cookie): a cross-site HTML form can only send form-encoded or text bodies, and those
 * are refused here before any controller runs. A browser can send JSON cross-site only
 * after a CORS preflight, which this API never grants.
 *
 * Bodyless mutating routes (`POST /positions/fill`, `POST /clients/:id/crawl-runs`) are
 * checked too. They used to be exempt for having no body to inspect, which left exactly
 * the requests a bodyless cross-site form can make resting on SameSite alone — one half
 * of a defence this comment claims has two.
 */
export function jsonOnlyMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (!MUTATING_METHODS.has(request.method)) {
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
