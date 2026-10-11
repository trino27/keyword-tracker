import type { ILighthouseIssueDefinition } from '../issue-definition.interface.js';

/**
 * Every audit Lighthouse scores in its SEO or accessibility category, as a finding the
 * PageSpeed worker writes from the mobile answer: a code per audit id, its weights as
 * Lighthouse's configuration gives them, and a severity that follows from the highest of
 * them (`lighthouseSeverityOf`).
 */
export const LIGHTHOUSE_CATALOGUE = {} as const satisfies Record<
  string,
  ILighthouseIssueDefinition
>;
