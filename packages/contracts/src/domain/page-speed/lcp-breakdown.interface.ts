/**
 * The phases Lighthouse splits a Largest Contentful Paint into, in the order they happen.
 * An image goes through all four; a text block has no resource to load, so it has only
 * the first and the last.
 */
export const LCP_PHASES = [
  'timeToFirstByte',
  'resourceLoadDelay',
  'resourceLoadDuration',
  'elementRenderDelay',
] as const;

export type TLcpPhase = (typeof LCP_PHASES)[number];

/** The element Lighthouse found to be the largest paint, as it names it. */
export interface ILcpElement {
  /** A CSS path to the element, e.g. `main > figure > img`. */
  selector: string;
  /** The element's opening HTML as Lighthouse quoted it, truncated by Lighthouse. */
  snippet: string;
}

/**
 * Where the LCP's time went, from Lighthouse's lab run. The milliseconds come from the
 * trace Lighthouse OBSERVED, without the throttling its lab LCP is simulated under, so
 * they add up to no LCP the page shows: a reader is given each phase's share, not a sum.
 */
export interface ILcpBreakdown {
  /** Null when Lighthouse named no element. */
  element: ILcpElement | null;
  /** In `LCP_PHASES` order; only the phases Lighthouse reported. */
  phases: { phase: TLcpPhase; ms: number }[];
}
