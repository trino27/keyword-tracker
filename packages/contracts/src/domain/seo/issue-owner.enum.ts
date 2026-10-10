/**
 * Who writes a finding: the crawl, from the HTML it fetched, or the PageSpeed worker, from
 * Google's measurement. Each writer replaces only the codes it owns, so neither erases the
 * other's findings — the crawl's replace runs minutes before the measurement lands.
 */
export const ISSUE_OWNERS = ['crawl', 'pageSpeed'] as const;

export type TIssueOwner = (typeof ISSUE_OWNERS)[number];
