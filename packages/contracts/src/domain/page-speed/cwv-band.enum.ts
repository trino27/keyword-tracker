/** Google's three bands for a Core Web Vital, best first. */
export const CWV_BANDS = ['good', 'needsImprovement', 'poor'] as const;

export type TCwvBand = (typeof CWV_BANDS)[number];
