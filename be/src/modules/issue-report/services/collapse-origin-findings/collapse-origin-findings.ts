import {
  CWV_ISSUE_CODES,
  type TCwvSeoIssue,
  type TReportIssue,
  type TSeoIssue,
} from '@app/contracts';
import type { IPageFinding } from '../../interfaces/page-finding.interface';

export type { IPageFinding };

/**
 * Each Core Web Vitals code's device and metric: the site has ONE figure per metric and
 * device, so its two bands' codes are one row's.
 */
const METRIC_OF = new Map<string, string>(
  Object.entries<Record<string, Record<string, string>>>(
    CWV_ISSUE_CODES,
  ).flatMap(([strategy, byMetric]) =>
    Object.entries(byMetric).flatMap(([metric, byBand]) =>
      Object.values(byBand).map(
        (code) => [code, `${strategy}:${metric}`] as const,
      ),
    ),
  ),
);

/**
 * A Core Web Vitals finding: the only kind whose value may be the site's. Image delivery
 * is a speed finding too, but a lab estimate about one page, and stays at it (plan D47).
 */
const isCwv = (issue: TSeoIssue): issue is TCwvSeoIssue =>
  METRIC_OF.has(issue.code);

/**
 * Page findings as report rows, with every Core Web Vitals finding whose value is the WHOLE SITE's
 * folded into one row per metric and device (plan D8): "INP needs improvement — whole site
 * (15 pages)" once, rather than the same sentence on fifteen pages. The row is the most
 * recently measured page's finding — code, level and figure — and counts every page in the
 * group: pages measured on different days can hold the site's figure in two bands, and
 * the site is in only one. URL- and lab-sourced findings stay per page, so one code can
 * appear both ways — some pages have figures of their own.
 */
export function collapseOriginFindings(
  findings: readonly IPageFinding[],
): TReportIssue[] {
  const rows: TReportIssue[] = [];
  const origin = new Map<string, IPageFinding[]>();

  for (const finding of findings) {
    const { issue } = finding;
    if (isCwv(issue) && issue.details.source === 'origin') {
      const key = METRIC_OF.get(issue.code)!;
      const group = origin.get(key) ?? [];
      group.push(finding);
      origin.set(key, group);
    } else {
      rows.push({ ...issue, location: { kind: 'page', page: finding.page } });
    }
  }

  for (const group of origin.values()) {
    const latest = [...group].sort(
      (a, b) =>
        (b.measuredAt?.getTime() ?? 0) - (a.measuredAt?.getTime() ?? 0) ||
        b.page.id - a.page.id,
    )[0];
    rows.push({
      ...(latest.issue as TCwvSeoIssue),
      location: { kind: 'allPages', pageCount: group.length },
    });
  }
  return rows;
}
