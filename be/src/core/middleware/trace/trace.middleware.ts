import type { NextFunction, Request, Response } from 'express';
import {
  currentTraceId,
  runWithTraceId,
} from '@infrastructure/observability/trace/trace-context';

export const REQUEST_ID_HEADER = 'X-Request-ID';

/**
 * One trace id per request, on every line the request produces and on the response.
 *
 * An incoming `X-Request-ID` is adopted rather than replaced, so a proxy's id and ours
 * are the same string in both logs. It is echoed back so a report of a failure can name
 * the request that failed.
 */
export function traceMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const incoming = request.headers['x-request-id'];
  const given = Array.isArray(incoming) ? incoming[0] : incoming;
  runWithTraceId(given?.trim() || undefined, () => {
    response.setHeader(REQUEST_ID_HEADER, currentTraceId() ?? '');
    next();
  });
}
