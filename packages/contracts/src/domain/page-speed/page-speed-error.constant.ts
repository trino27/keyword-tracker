/**
 * Why a page has no fresh measurement, as stored in `page_speed.last_error` and read after
 * "Couldn't measure:" or "Couldn't refresh:". Written for a marketer: what happened, never
 * an HTTP status. A 429 and a rejected key are not here on purpose — neither is the page's
 * failure; the first pauses the queue, the second halts it.
 */
export const PAGE_SPEED_ERRORS = {
  PSI_UNAVAILABLE: {
    reason: "Google's PageSpeed service did not answer after several tries.",
  },
  PAGE_LOAD_FAILED: { reason: 'Google could not load the page.' },
  PAGE_ERRORED: { reason: 'The page answered Google with an error.' },
  PSI_REJECTED: { reason: 'Google refused to test this address.' },
  NO_MEASUREMENT: {
    reason: 'Google returned no usable measurement for this page.',
  },
  ABANDONED: { reason: 'The measurement was interrupted several times.' },
} as const satisfies Record<string, { reason: string }>;

export type TPageSpeedErrorCode = keyof typeof PAGE_SPEED_ERRORS;

export const PAGE_SPEED_ERROR_CODES = Object.keys(
  PAGE_SPEED_ERRORS,
) as TPageSpeedErrorCode[];
