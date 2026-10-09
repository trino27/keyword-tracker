/**
 * A measured verdict: the value as found, and the bounds it was judged against.
 *
 * The bounds are snapshotted into the finding at crawl time rather than read from the
 * catalogue when a screen renders, so changing a threshold later does not rewrite what an
 * old crawl concluded — the row explains its own verdict.
 */
export interface ISeoMeasurement {
  value: number;
  min?: number;
  max?: number;
  /** What was measured, as found on the page — the title itself, not only its length. */
  evidence?: string[];
}
