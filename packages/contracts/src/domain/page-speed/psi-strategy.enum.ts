/**
 * The device PageSpeed Insights emulates; its query parameter `strategy`. The order is the
 * Postgres enum's order, and the claim takes a client's mobile rows first by it: mobile
 * feeds the score, the list's badges and Lighthouse's verdicts.
 */
export const PSI_STRATEGIES = ['mobile', 'desktop'] as const;

export type TPsiStrategy = (typeof PSI_STRATEGIES)[number];
