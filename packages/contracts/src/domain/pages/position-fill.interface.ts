/**
 * What one "generate positions" run did for the signed-in user.
 *
 * Positions are invented by the seed's generator, not measured; this is the same fill
 * the seed command performs, narrowed to one user's pairs so the UI can ask for it.
 */
export interface IPositionFillResult {
  /** Page–keyword pairs the run covered. */
  pairs: number;
  /** Snapshots written. Zero when every pair already has today's. */
  added: number;
}
