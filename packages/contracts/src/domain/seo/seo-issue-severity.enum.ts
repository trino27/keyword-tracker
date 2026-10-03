/** How bad an SEO issue is; the order is the display order. */
export const SEO_ISSUE_SEVERITIES = ['error', 'warning', 'notice'] as const;

export type TSeoIssueSeverity = (typeof SEO_ISSUE_SEVERITIES)[number];
