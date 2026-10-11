import { z } from 'zod';
import {
  ACTIVE_LIGHTHOUSE_CODES,
  LIGHTHOUSE_CATALOGUE,
  type TLighthouseIssueCode,
  type TLighthouseSeoIssue,
} from '@app/contracts';

/**
 * What Lighthouse's SEO category said about the page, in the shape the crawl records its
 * own checks in: the codes judged, the codes that did not apply, and a finding per judged
 * code that failed. Of the accessibility category only its score is kept: its audits are
 * retired (`ACTIVE_LIGHTHOUSE_CODES`), and the page shows the score as an overview.
 */
export interface ILighthouseRecord {
  judged: TLighthouseIssueCode[];
  notApplicable: TLighthouseIssueCode[];
  findings: TLighthouseSeoIssue[];
  /** 0..100, or null when the answer lacks the category. */
  seoScore: number | null;
  accessibilityScore: number | null;
  /** SEO audits the answer scored that no active code reads: a stale catalogue. */
  unknownAudits: string[];
}

const categorySchema = z.object({
  score: z.number().nullable().optional(),
  auditRefs: z
    .array(z.object({ id: z.string(), weight: z.number() }))
    .default([]),
});

const auditSchema = z.object({
  score: z.number().nullable().optional(),
  scoreDisplayMode: z.string(),
});

/** Exactly the paths read below; everything else in the answer is ignored. */
const answerSchema = z.object({
  lighthouseResult: z.object({
    categories: z.object({
      seo: categorySchema.optional(),
      accessibility: categorySchema.optional(),
    }),
    audits: z.record(
      z.string(),
      auditSchema.catch({ scoreDisplayMode: 'error' }),
    ),
  }),
});

/** The active codes by the audit id an answer reports them under. */
const CODE_OF_AUDIT: ReadonlyMap<string, TLighthouseIssueCode> = new Map(
  ACTIVE_LIGHTHOUSE_CODES.map((code) => [
    LIGHTHOUSE_CATALOGUE[code].audit,
    code,
  ]),
);

/**
 * Each active code's audit as the answer reports it (lighthouse-checks D13):
 *
 * - `binary` scored 1 is judged and passed; scored 0, judged and a finding;
 * - `notApplicable` is listed as such;
 * - `error`, any other mode, or an audit the answer lacks is in neither list — nothing is
 *   invented for an audit that did not report.
 *
 * Null when the answer has neither category: the record is then absent, not empty, and
 * the measurement is stored all the same (D20).
 */
export function extractLighthouse(body: unknown): ILighthouseRecord | null {
  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) return null;
  const { categories, audits } = parsed.data.lighthouseResult;
  if (!categories.seo && !categories.accessibility) return null;

  const judged: TLighthouseIssueCode[] = [];
  const notApplicable: TLighthouseIssueCode[] = [];
  const findings: TLighthouseSeoIssue[] = [];
  for (const code of ACTIVE_LIGHTHOUSE_CODES) {
    const audit = audits[LIGHTHOUSE_CATALOGUE[code].audit];
    if (audit?.scoreDisplayMode === 'notApplicable') notApplicable.push(code);
    if (audit?.scoreDisplayMode !== 'binary') continue;
    if (audit.score !== 0 && audit.score !== 1) continue;
    judged.push(code);
    if (audit.score === 0)
      findings.push({
        code,
        severity: LIGHTHOUSE_CATALOGUE[code].severity,
        details: {},
      });
  }

  const scored =
    categories.seo?.auditRefs
      .filter(({ weight }) => weight > 0)
      .map(({ id }) => id) ?? [];
  return {
    judged,
    notApplicable,
    findings,
    seoScore: percent(categories.seo?.score),
    accessibilityScore: percent(categories.accessibility?.score),
    unknownAudits: [...new Set(scored)].filter((id) => !CODE_OF_AUDIT.has(id)),
  };
}

function percent(score: number | null | undefined): number | null {
  return score === null || score === undefined ? null : Math.round(score * 100);
}
