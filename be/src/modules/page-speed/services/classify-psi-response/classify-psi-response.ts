import { z } from 'zod';
import type { TPageSpeedErrorCode } from '@app/contracts';
import { RemoteApiError } from '@infrastructure/remote-api/remote-api.errors';
import { PAGE_SPEED_DEFAULT_PAUSE_MS } from '../../constants/page-speed-worker.constant';
import {
  extractImageDelivery,
  type IExtractedImageDelivery,
} from '../extract-image-delivery/extract-image-delivery';
import {
  extractLighthouse,
  type ILighthouseRecord,
} from '../extract-lighthouse/extract-lighthouse';
import {
  extractDiagnostics,
  extractMeasurement,
  type IExtractedDiagnostics,
  type IExtractedMeasurement,
} from '../extract-measurement/extract-measurement';

/** What one PageSpeed call came to, and therefore what the worker does next. */
export type TPsiOutcome =
  | {
      kind: 'measured';
      measurement: IExtractedMeasurement;
      /** Never null beside a measurement: both read the same parsed answer. */
      diagnostics: IExtractedDiagnostics;
      /** Null when the answer has neither Lighthouse category (D20). */
      lighthouse: ILighthouseRecord | null;
      /**
       * Lighthouse's image-delivery audit; null when the answer has none or it does not
       * parse. Never a condition of `measured` (plan D46).
       */
      imageDelivery: IExtractedImageDelivery | null;
    }
  /** Google did not answer usefully this time: try the page again later. */
  | { kind: 'transient'; error: 'PSI_UNAVAILABLE' }
  /** Too many requests: every slot pauses, and the page loses no attempt. */
  | { kind: 'rateLimited'; pauseMs: number }
  /** The key is refused: the queue halts until the key is fixed and the API restarted. */
  | { kind: 'keyRejected' }
  /** Something about this page that retrying will not change. */
  | {
      kind: 'permanent';
      error: Exclude<TPageSpeedErrorCode, 'PSI_UNAVAILABLE' | 'ABANDONED'>;
    };

export type TPsiCallResult =
  | {
      response: {
        status: number;
        headers: Record<string, string>;
        body: Buffer;
      };
    }
  | { error: unknown };

/**
 * A Retry-After longer than this is still honoured, up to here — and a spent DAILY quota
 * pauses this long: retrying it every minute would ask Google all day for nothing.
 */
const MAX_PAUSE_MS = 60 * 60 * 1000;

/** Reasons that mean the day's quota is gone, not a burst over the per-minute rate. */
const DAILY_QUOTA_REASONS = new Set(['dailyLimitExceeded', 'quotaExceeded']);

/** Google's quota reasons, old and new. */
const RATE_LIMIT_REASONS = new Set([
  'rateLimitExceeded',
  'RATE_LIMIT_EXCEEDED',
  'userRateLimitExceeded',
  'dailyLimitExceeded',
  'quotaExceeded',
]);

/** Reasons that mean the key — not the page — is the problem. */
const KEY_REASONS = new Set([
  'API_KEY_INVALID',
  'API_KEY_EXPIRED',
  'API_KEY_SERVICE_BLOCKED',
  'API_KEY_HTTP_REFERRER_BLOCKED',
  'API_KEY_IP_ADDRESS_BLOCKED',
  'API_KEY_ANDROID_APP_BLOCKED',
  'API_KEY_IOS_APP_BLOCKED',
  'SERVICE_DISABLED',
  'CONSUMER_INVALID',
  'keyInvalid',
]);

const LIGHTHOUSE_ERRORS: Record<string, TPsiOutcome & { kind: 'permanent' }> = {
  FAILED_DOCUMENT_REQUEST: { kind: 'permanent', error: 'PAGE_LOAD_FAILED' },
  ERRORED_DOCUMENT_REQUEST: { kind: 'permanent', error: 'PAGE_ERRORED' },
  // What Google answers, live, for an empty error page — not ERRORED_DOCUMENT_REQUEST.
  NO_FCP: { kind: 'permanent', error: 'PAGE_ERRORED' },
};

const googleErrorSchema = z.object({
  error: z.object({
    message: z.string().optional(),
    status: z.string().optional(),
    errors: z.array(z.object({ reason: z.string().optional() })).optional(),
    details: z
      .array(
        z.object({
          reason: z.string().optional(),
          metadata: z.record(z.string(), z.string()).optional(),
        }),
      )
      .optional(),
  }),
});

const runtimeErrorSchema = z.object({
  lighthouseResult: z.object({
    runtimeError: z.object({ code: z.string() }),
  }),
});

/**
 * Reads one PageSpeed call, in this precedence (plan §10.5): a network failure; a rate
 * limit; a refused key; a Lighthouse error naming the page; any other 5xx or 4xx; and a
 * 200, which is a measurement or says there is none. A thrown error that is not an
 * outbound failure is a bug and is rethrown, never filed as Google's.
 */
export function classifyPsiResponse(
  input: TPsiCallResult,
  now: number = Date.now(),
): TPsiOutcome {
  if ('error' in input) {
    if (!(input.error instanceof RemoteApiError)) throw input.error;
    return input.error.retryable
      ? { kind: 'transient', error: 'PSI_UNAVAILABLE' }
      : { kind: 'permanent', error: 'PSI_REJECTED' };
  }

  const { status, headers, body } = input.response;
  const json = parseJson(body);
  const googleError = googleErrorSchema.safeParse(json);
  const reasons = googleError.success
    ? [
        ...(googleError.data.error.errors ?? []),
        ...(googleError.data.error.details ?? []),
      ].flatMap((entry) => (entry.reason ? [entry.reason] : []))
    : [];
  const message = googleError.success
    ? (googleError.data.error.message ?? '')
    : '';

  if (
    status === 429 ||
    (googleError.success &&
      googleError.data.error.status === 'RESOURCE_EXHAUSTED') ||
    reasons.some((reason) => RATE_LIMIT_REASONS.has(reason))
  )
    return {
      kind: 'rateLimited',
      pauseMs: isDailyQuota(googleError.data, reasons, message)
        ? MAX_PAUSE_MS
        : pauseOf(headers['retry-after'], now),
    };

  if (
    (status === 400 || status === 403) &&
    (reasons.some((reason) => KEY_REASONS.has(reason)) ||
      /api key/i.test(message))
  )
    return { kind: 'keyRejected' };

  const lighthouseCode =
    /Lighthouse returned error: ([A-Z_]+)/.exec(message)?.[1] ??
    (status === 200
      ? runtimeErrorSchema.safeParse(json).data?.lighthouseResult.runtimeError
          .code
      : undefined);

  if (status === 200) {
    const measurement = extractMeasurement(json);
    const diagnostics = extractDiagnostics(json);
    if (measurement && diagnostics)
      return {
        kind: 'measured',
        measurement,
        diagnostics,
        lighthouse: extractLighthouse(json),
        imageDelivery: extractImageDelivery(json),
      };
    if (lighthouseCode)
      return (
        LIGHTHOUSE_ERRORS[lighthouseCode] ?? {
          kind: 'permanent',
          error: 'PSI_REJECTED',
        }
      );
    return { kind: 'permanent', error: 'NO_MEASUREMENT' };
  }

  if (lighthouseCode)
    return (
      LIGHTHOUSE_ERRORS[lighthouseCode] ?? {
        kind: 'permanent',
        error: 'PSI_REJECTED',
      }
    );
  if (status >= 500) return { kind: 'transient', error: 'PSI_UNAVAILABLE' };
  return { kind: 'permanent', error: 'PSI_REJECTED' };
}

/** Google names the spent limit in the answer: a per-day one, or a per-minute one. */
function isDailyQuota(
  error: z.infer<typeof googleErrorSchema> | undefined,
  reasons: string[],
  message: string,
): boolean {
  if (reasons.some((reason) => DAILY_QUOTA_REASONS.has(reason))) return true;
  const limits = (error?.error.details ?? []).map(
    (detail) => detail.metadata?.quota_limit ?? '',
  );
  return (
    limits.some((limit) => /PerDay/i.test(limit)) || /per day/i.test(message)
  );
}

function parseJson(body: Buffer): unknown {
  try {
    return JSON.parse(body.toString('utf8')) as unknown;
  } catch {
    return undefined;
  }
}

/** Retry-After in seconds or as an HTTP date; the default when absent or unreadable. */
function pauseOf(retryAfter: string | undefined, now: number): number {
  if (!retryAfter) return PAGE_SPEED_DEFAULT_PAUSE_MS;
  const seconds = Number(retryAfter);
  const ms = Number.isFinite(seconds)
    ? seconds * 1_000
    : Date.parse(retryAfter) - now;
  if (!Number.isFinite(ms) || ms <= 0) return PAGE_SPEED_DEFAULT_PAUSE_MS;
  return Math.min(ms, MAX_PAUSE_MS);
}
