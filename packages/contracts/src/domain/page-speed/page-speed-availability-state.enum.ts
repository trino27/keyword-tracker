/**
 * Whether PageSpeed can measure, as every screen must say it: no key configured, a key in
 * use, or a key Google refused — after which the queue is halted until the API restarts.
 * Three states because "Measuring…" forever under a refused key would be a false sentence.
 */
export const PAGE_SPEED_AVAILABILITY_STATES = [
  'notConfigured',
  'active',
  'keyRejected',
] as const;

export type TPageSpeedAvailabilityState =
  (typeof PAGE_SPEED_AVAILABILITY_STATES)[number];
