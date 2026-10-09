/**
 * The three verdicts as plain objects, for `toEqual`. A spec that writes them out by hand
 * reads as punctuation; named, the difference between "passed" and "could not be judged" —
 * the whole reason the third outcome exists — is visible in the assertion itself.
 */
export const PASSES = { outcome: 'pass' };
export const NOT_APPLICABLE = { outcome: 'notApplicable' };
/**
 * A finding carrying at least these details. `objectContaining` because every finding
 * also carries `evidence`, quoted from the page, which each check's own spec pins
 * separately: repeating the quotes in every assertion about a count would make each
 * wording change a change to thirty specs.
 */
export const failsWith = (details: Record<string, unknown>) => ({
  outcome: 'fails',
  details: expect.objectContaining(details) as Record<string, unknown>,
});

/** The evidence a finding quotes, for the specs that pin it. */
export const evidenceOf = (verdict: unknown): string[] =>
  (verdict as { details?: { evidence?: string[] } }).details?.evidence ?? [];
