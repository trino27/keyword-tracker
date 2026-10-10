import type { IPageSpeedAvailability } from '../page-speed/page-speed-availability.interface.js';
import type {
  TPageSpeedSeoIssue,
  TSeoIssue,
} from '../seo/seo-issue.interface.js';
import type { TSeoIssueSeverity } from '../seo/seo-issue-severity.enum.js';
import type { TSiteCheckCode } from '../site/site-check-catalogue.constant.js';

/** A finding on one page of the client's current crawl. */
export interface IPageLocation {
  kind: 'page';
  page: { id: number; url: string; title: string | null };
}

/**
 * A speed finding Google only has for the whole site: one row standing for every current
 * page that carries it, instead of the same row once per page (plan D8).
 */
export interface IAllPagesLocation {
  kind: 'allPages';
  pageCount: number;
}

/** A site check: robots.txt, the sitemap, the host — no page to belong to. */
export interface ISiteLocation {
  kind: 'site';
}

export type TReportLocation = IPageLocation | IAllPagesLocation | ISiteLocation;

/**
 * One row of the report. The copy — what, why, fix — is not here: the screen reads it
 * from the catalogue by `code`, so the wire carries facts and the words have one source.
 */
export type TReportIssue =
  | (TSeoIssue & { location: IPageLocation })
  | (TPageSpeedSeoIssue & { location: IAllPagesLocation })
  | {
      code: TSiteCheckCode;
      severity: TSeoIssueSeverity;
      details: Record<string, unknown>;
      location: ISiteLocation;
    };

/**
 * Every finding the tracker holds about one client, as ONE snapshot of its current crawl:
 * page findings (crawl and speed), whole-site speed rows, and failed site checks. Filtered
 * and grouped on the screen, never on the server — a client has at most a few hundred.
 */
export interface IClientIssueReport {
  client: { id: number; name: string };
  /** The crawl the snapshot is of; null while no crawl of the client has finished. */
  generatedFrom: { runId: number; finishedAt: string } | null;
  pageSpeedAvailability: IPageSpeedAvailability;
  /** Pages on that crawl: what a site check's "every page" means. */
  currentPages: number;
  issues: TReportIssue[];
}
