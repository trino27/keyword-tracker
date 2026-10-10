/**
 * A page's place in the PageSpeed queue: waiting, being measured, measured, or given up
 * on. A transient failure returns the row to `queued` with a later not-before time.
 */
export const PAGE_SPEED_STATUSES = [
  'queued',
  'running',
  'done',
  'failed',
] as const;

export type TPageSpeedStatus = (typeof PAGE_SPEED_STATUSES)[number];
