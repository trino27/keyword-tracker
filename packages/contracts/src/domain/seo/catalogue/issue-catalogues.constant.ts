import {
  PSI_STRATEGIES,
  type TPsiStrategy,
} from '../../page-speed/psi-strategy.enum.js';
import { CRAWL_CATALOGUE } from './crawl/crawl-catalogue.constant.js';
import type {
  ICrawlIssueDefinition,
  ILighthouseIssueDefinition,
  IPageSpeedIssueDefinition,
} from './issue-definition.interface.js';
import { LIGHTHOUSE_CATALOGUE } from './lighthouse/lighthouse-catalogue.constant.js';
import { PAGE_SPEED_CATALOGUE } from './page-speed/page-speed-catalogue.constant.js';

/** One owner: the entries it writes, and whether its verdicts count in a page's score. */
export interface IIssueOwnerDefinition {
  scored: boolean;
  entries: Readonly<
    Record<
      string,
      | ICrawlIssueDefinition
      | IPageSpeedIssueDefinition
      | ILighthouseIssueDefinition
    >
  >;
}

/**
 * Who writes a finding, and the codes each writer owns. Each writer replaces only its own
 * codes, so none erases another's findings — the crawl's replace runs minutes before the
 * measurement lands.
 *
 * - `crawl` judges the page's HTML;
 * - `pageSpeed` writes the Core Web Vitals bands from Google's measurement. They count among
 *   a page's issues and never in its score;
 * - `lighthouse` writes the SEO and accessibility audits Lighthouse scored in the same
 *   answer. They are checks and count in the score.
 *
 * Everything about owners is derived from this object. A new owner is a folder and one line
 * here; a list of owners written anywhere else is a list that can go stale.
 */
export const ISSUE_CATALOGUES = {
  crawl: { scored: true, entries: CRAWL_CATALOGUE },
  pageSpeed: { scored: false, entries: PAGE_SPEED_CATALOGUE },
  lighthouse: { scored: true, entries: LIGHTHOUSE_CATALOGUE },
} as const satisfies Record<string, IIssueOwnerDefinition>;

type TCatalogues = typeof ISSUE_CATALOGUES;

export type TIssueOwner = keyof TCatalogues;

export type TIssueCodeOf<O extends TIssueOwner> =
  keyof TCatalogues[O]['entries'] & string;

/** The owners whose verdicts are checks: listed per page and counted in its score. */
export type TScoredIssueOwner = {
  [O in TIssueOwner]: TCatalogues[O]['scored'] extends true ? O : never;
}[TIssueOwner];

/**
 * Compiles only while no code belongs to two owners. A code in two sets would be deleted
 * by one writer's replace and re-added by the other's.
 */
type TSharedCodes = {
  [A in TIssueOwner]: {
    [B in Exclude<TIssueOwner, A>]: TIssueCodeOf<A> & TIssueCodeOf<B>;
  }[Exclude<TIssueOwner, A>];
}[TIssueOwner];
const OWNERS_ARE_DISJOINT: [TSharedCodes] extends [never] ? true : never = true;
void OWNERS_ARE_DISJOINT;

type TUnionToIntersection<U> = (
  U extends unknown ? (union: U) => void : never
) extends (intersection: infer I) => void
  ? I
  : never;

type TStamped<O extends TIssueOwner> = {
  readonly [K in TIssueCodeOf<O>]: TCatalogues[O]['entries'][K] & {
    readonly owner: O;
  };
};

/** Every owner's entries in one record, each stamped with the owner it sits under. */
export type TSeoIssueCatalogue = TUnionToIntersection<
  { [O in TIssueOwner]: TStamped<O> }[TIssueOwner]
>;

export const ISSUE_OWNERS = Object.keys(ISSUE_CATALOGUES) as TIssueOwner[];

export const SCORED_ISSUE_OWNERS = ISSUE_OWNERS.filter(
  (owner) => ISSUE_CATALOGUES[owner].scored,
) as TScoredIssueOwner[];

/**
 * Every finding the tracker can report, from every owner: what the screens render labels,
 * hints and severities from, and what a stored code is read back through.
 */
export const SEO_ISSUE_CATALOGUE = Object.fromEntries(
  ISSUE_OWNERS.flatMap((owner) =>
    Object.entries(ISSUE_CATALOGUES[owner].entries).map(([code, entry]) => [
      code,
      { ...entry, owner },
    ]),
  ),
) as unknown as TSeoIssueCatalogue;

export type TSeoIssueCode = keyof TSeoIssueCatalogue & string;

export const SEO_ISSUE_CODES = Object.keys(
  SEO_ISSUE_CATALOGUE,
) as TSeoIssueCode[];

/** One owner's codes, in its catalogue's order. */
export function issueCodesOf<O extends TIssueOwner>(
  owner: O,
): TIssueCodeOf<O>[] {
  return Object.keys(ISSUE_CATALOGUES[owner].entries) as TIssueCodeOf<O>[];
}

export type TCrawlIssueCode = TIssueCodeOf<'crawl'>;
export type TPageSpeedIssueCode = TIssueCodeOf<'pageSpeed'>;
export type TLighthouseIssueCode = TIssueCodeOf<'lighthouse'>;

export const CRAWL_ISSUE_CODES = issueCodesOf('crawl');
export const PAGE_SPEED_ISSUE_CODES = issueCodesOf('pageSpeed');
export const LIGHTHOUSE_ISSUE_CODES = issueCodesOf('lighthouse');

/** The pageSpeed codes whose entry declares the device `S`: what that device's replace deletes. */
export type TPageSpeedIssueCodeOf<S extends TPsiStrategy> = {
  [
    K in TPageSpeedIssueCode
  ]: (typeof PAGE_SPEED_CATALOGUE)[K]['strategy'] extends S ? K : never;
}[TPageSpeedIssueCode];

/**
 * Each device's speed codes, read from the entries' `strategy`, so a code is in exactly
 * one list and neither can drift from the catalogue. A measurement replaces only its own
 * device's findings: a desktop answer never erases the mobile ones, nor the other way.
 */
export const PAGE_SPEED_CODES_BY_STRATEGY = Object.fromEntries(
  PSI_STRATEGIES.map((strategy) => [
    strategy,
    PAGE_SPEED_ISSUE_CODES.filter(
      (code) => PAGE_SPEED_CATALOGUE[code].strategy === strategy,
    ),
  ]),
) as { [S in TPsiStrategy]: TPageSpeedIssueCodeOf<S>[] };

/**
 * The crawl's codes split by what a check can see. Derived from the entries, so a code is
 * in exactly one of them and neither list can drift from the catalogue.
 *
 * The split is what decides a check's SHAPE from its code rather than from the check:
 * a run code's unit takes the whole crawl and answers once per page, every other code's
 * takes one page. So the wrong shape under a code is a compile error, not a check that
 * runs and never fires — which is what it would be, since "is another page using this
 * title" cannot be answered from one page at all.
 */
export type TRunIssueCode = {
  [K in TCrawlIssueCode]: (typeof CRAWL_CATALOGUE)[K] extends {
    scope: 'run';
  }
    ? K
    : never;
}[TCrawlIssueCode];

export type TPageIssueCode = Exclude<TCrawlIssueCode, TRunIssueCode>;

export const RUN_ISSUE_CODES = CRAWL_ISSUE_CODES.filter(
  (code) => 'scope' in CRAWL_CATALOGUE[code],
) as TRunIssueCode[];

export const PAGE_ISSUE_CODES = CRAWL_ISSUE_CODES.filter(
  (code) => !('scope' in CRAWL_CATALOGUE[code]),
) as TPageIssueCode[];

/**
 * The codes a crawl runs and a screen lists as checks — the crawl's codes minus what
 * `enabled: false` has retired. The speed codes are never here: no crawl runs them, and
 * they count in neither a page's checks nor its score.
 *
 * Both sides iterate THIS, never `SEO_ISSUE_CODES`: the analysis so a retired check
 * produces no verdict, and `composePageChecks` so it produces no row. Lookups by code
 * keep using the catalogue itself, which is the point of retiring rather than deleting —
 * a finding stored under a retired code still has a label, a hint and a severity to be
 * rendered with.
 *
 * A page crawled before a check was retired keeps it in its stored denominator, so its
 * score counts a check the list no longer shows. That is the same arrangement a page
 * already has with a check added after it was crawled, and it is why the score is
 * explained as what applied WHEN THE PAGE WAS CRAWLED; the next crawl settles it.
 */
export const ACTIVE_ISSUE_CODES = CRAWL_ISSUE_CODES.filter(
  (code) => !('enabled' in CRAWL_CATALOGUE[code]),
);
