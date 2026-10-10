import {
  PAGE_SPEED_BACKOFF_BASE_MS,
  PAGE_SPEED_BACKOFF_FACTOR,
} from '../../constants/page-speed-worker.constant';

/**
 * How long to wait after the n-th failed attempt before the next: long enough that an
 * outage of Google's is waited out rather than hammered, short enough that a blip costs
 * minutes. The 5th failure is final, so there is no fifth delay.
 */
export function retryDelayMs(failedAttempt: number): number {
  return (
    PAGE_SPEED_BACKOFF_BASE_MS *
    PAGE_SPEED_BACKOFF_FACTOR ** (failedAttempt - 1)
  );
}
