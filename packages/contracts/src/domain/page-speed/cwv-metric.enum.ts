/** The three Core Web Vitals, in the order every screen lists them. */
export const CWV_METRICS = ['lcp', 'inp', 'cls'] as const;

export type TCwvMetric = (typeof CWV_METRICS)[number];
