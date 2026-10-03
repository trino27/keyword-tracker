/**
 * Lighthouse's published bands, adopted because its model is public and ours matches it:
 * a share of equally weighted binary audits. Borrowing the thresholds means a user who
 * has seen one of these numbers before reads this one the same way.
 */
export const SCORE_BANDS = [
  { max: 49, band: 'poor' },
  { max: 89, band: 'average' },
  { max: 100, band: 'good' },
] as const;

export type TScoreBand = (typeof SCORE_BANDS)[number]['band'];

/** The band a score falls in. Every score 0–100 falls in exactly one. */
export function scoreBandOf(value: number): TScoreBand {
  return (SCORE_BANDS.find((band) => value <= band.max) ?? SCORE_BANDS.at(-1)!)
    .band;
}
