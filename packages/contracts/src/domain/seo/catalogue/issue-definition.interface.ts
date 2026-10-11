import type { IPlainCopy } from '../plain-copy.interface.js';
import type { TSeoIssueSeverity } from '../seo-issue-severity.enum.js';

/** A page that backs a check's claim, named for the reader as its publisher names it. */
export interface ISeoIssueSource {
  title: string;
  url: string;
}

/**
 * What every catalogue entry says, whoever writes its findings. An entry does not name its
 * owner: the owner is the registry key its catalogue sits under (`ISSUE_CATALOGUES`), and
 * the flattened catalogue stamps it on — so an entry cannot claim one owner while living in
 * another's catalogue.
 */
export interface ISeoIssueDefinition {
  severity: TSeoIssueSeverity;
  /** Short, shown as the issue's name. */
  label: string;
  /**
   * The finding in a marketer's words — what is wrong, what it costs, who fixes it. Required,
   * so an entry cannot be added without the version its reader acts on.
   */
  plain: IPlainCopy;
  /** One sentence on what to do. */
  hint: string;
  /**
   * What the check looks at, why it matters and to whom, and what fixes it — including,
   * where it is true, that Google does NOT use the signal. Several sentences, because a
   * finding a reader cannot weigh is a finding they cannot act on, and a catalogue that
   * overstates its case manufactures urgency.
   */
  explanation: string;
  /** Where the explanation's claims come from: at least one, first-party wherever one exists. */
  sources: readonly ISeoIssueSource[];
  /** Inclusive bounds of the acceptable value, where the rule has one. */
  min?: number;
  max?: number;
}

/** A check the crawl runs on a page's HTML. */
export interface ICrawlIssueDefinition extends ISeoIssueDefinition {
  /**
   * What the check reads as when it passed — "Language is declared" beside a passed
   * LANG_MISSING. `label` names the problem, which beside a green mark reads as if the
   * problem were the good outcome; a list of checks shows this instead for a pass.
   */
  passLabel: string;
  /**
   * Why this check can be skipped, for the codes whose rule can answer `notApplicable`.
   * A property of the RULE, not of a page — `IMAGES_MISSING_ALT` is skipped for one
   * reason every time — so it is a constant here rather than a fact stored per page.
   * Its presence is what `CONDITIONAL_ISSUE_CODES` reads.
   */
  skipReason?: string;
  /**
   * `false` takes the check out of circulation without removing its code. Removing the
   * code is not an option: a page crawled while the check ran keeps it in
   * `checks_judged` and may hold a finding under it, and both are read back through
   * this catalogue — a missing entry would fail the gateway's own validation of data it
   * stored itself. Absent means the ordinary thing: the check runs.
   */
  enabled?: false;
  /**
   * `run` marks a check that cannot be answered from one page — it compares the page
   * with the others crawled in the same run. Absent means the ordinary thing: the
   * page judges itself.
   */
  scope?: 'run';
}

/** A Core Web Vitals band the PageSpeed worker writes from Google's measurement. */
export type IPageSpeedIssueDefinition = ISeoIssueDefinition;

/** The two Lighthouse categories whose audits are catalogued. */
export type TLighthouseCategory = 'seo' | 'accessibility';

/**
 * A Lighthouse audit the PageSpeed worker writes from the same answer. `audit` is the id
 * the answer reports it under; `weights` are its weight in each category that references
 * it — one audit can sit in both (`image-alt`, `document-title`) — taken from Lighthouse's
 * configuration, never from an answer, which reports 0 for an audit that did not apply.
 */
export interface ILighthouseIssueDefinition extends ISeoIssueDefinition {
  /**
   * What the check reads as when it passed — "Language is declared" beside a passed
   * LANG_MISSING. `label` names the problem, which beside a green mark reads as if the
   * problem were the good outcome; a list of checks shows this instead for a pass.
   */
  passLabel: string;
  audit: string;
  weights: Partial<Record<TLighthouseCategory, number>>;
}
