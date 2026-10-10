/**
 * Where a Core Web Vitals value came from, best first: real Chrome visitors to this page,
 * real visitors to the whole site (Google's fallback when the page has too few), or one
 * Lighthouse lab run. INP is never `lab` — a lab run loads the page and does not use it.
 */
export const CWV_SOURCES = ['url', 'origin', 'lab'] as const;

export type TCwvSource = (typeof CWV_SOURCES)[number];
