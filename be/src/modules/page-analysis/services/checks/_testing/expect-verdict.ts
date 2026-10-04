/**
 * The three verdicts as plain objects, for `toEqual`. A spec that writes them out by hand
 * reads as punctuation; named, the difference between "passed" and "could not be judged" —
 * the whole reason the third outcome exists — is visible in the assertion itself.
 */
export const PASSES = { outcome: 'pass' };
export const NOT_APPLICABLE = { outcome: 'notApplicable' };
export const failsWith = (details: Record<string, unknown>) => ({
  outcome: 'fails',
  details,
});
