import { ACTIVE_LIGHTHOUSE_CODES } from '@app/contracts';
import { readPageSpeedFixture } from '../../_testing/read-page-speed-fixture';
import { extractLighthouse } from './extract-lighthouse';

type TAnswer = {
  lighthouseResult: {
    categories: Record<string, unknown>;
    audits: Record<
      string,
      { score: number | null; scoreDisplayMode: string; id?: string }
    >;
  };
};

const answer = (file = 'lighthouse-url-field.json') =>
  readPageSpeedFixture(file) as TAnswer;

describe('extractLighthouse', () => {
  it('judges a passed audit, a failed one, and lists one that did not apply', () => {
    const record = extractLighthouse(answer('lighthouse-lab-only.json'));

    expect(record?.judged).toEqual(
      expect.arrayContaining([
        'LH_DOCUMENT_TITLE',
        'LH_HREFLANG',
        'LH_META_DESCRIPTION',
      ]),
    );
    expect(record?.notApplicable).toEqual(['LH_ROBOTS_TXT', 'LH_CANONICAL']);
  });

  it("makes a failed audit a finding at the catalogue's severity, and nothing else", () => {
    const record = extractLighthouse(answer());

    expect(record?.findings).toEqual([
      { code: 'LH_ROBOTS_TXT', severity: 'notice', details: {} },
    ]);
  });

  /**
   * The accessibility audits are retired: this answer fails color-contrast and link-name
   * and skips accesskeys, and none of them is recorded — only the category's score is.
   */
  it('records no accessibility audit, failed or not applicable', () => {
    const record = extractLighthouse(answer())!;
    const all = [
      ...record.judged,
      ...record.notApplicable,
      ...record.findings.map(({ code }) => code),
    ];

    for (const code of ['LH_COLOR_CONTRAST', 'LH_LINK_NAME', 'LH_ACCESSKEYS'])
      expect(all).not.toContain(code);
    expect(record.accessibilityScore).toBe(94);
  });

  /** The failed count is what the score reads; it is the findings, never counted twice. */
  it('counts each failed audit once, and every failure is judged', () => {
    const record = extractLighthouse(answer('lighthouse-lab-only.json'))!;

    expect(record.findings).toHaveLength(2);
    for (const { code } of record.findings)
      expect(record.judged).toContain(code);
  });

  it('leaves an audit that errored out of both lists', () => {
    const body = answer();
    body.lighthouseResult.audits['robots-txt'] = {
      score: null,
      scoreDisplayMode: 'error',
    };

    const record = extractLighthouse(body)!;

    expect(record.judged).not.toContain('LH_ROBOTS_TXT');
    expect(record.notApplicable).not.toContain('LH_ROBOTS_TXT');
    expect(record.findings.map(({ code }) => code)).not.toContain(
      'LH_ROBOTS_TXT',
    );
  });

  it('leaves an audit the answer does not carry out of both lists', () => {
    const body = answer();
    delete body.lighthouseResult.audits.canonical;

    const record = extractLighthouse(body)!;

    expect([...record.judged, ...record.notApplicable]).not.toContain(
      'LH_CANONICAL',
    );
  });

  it('records every active code at most once, in one list', () => {
    const record = extractLighthouse(answer())!;
    const all = [...record.judged, ...record.notApplicable];

    expect(new Set(all).size).toBe(all.length);
    for (const code of all) expect(ACTIVE_LIGHTHOUSE_CODES).toContain(code);
  });

  it('names a scored audit the catalogue does not know, and records nothing for it', () => {
    const body = answer();
    const seo = body.lighthouseResult.categories.seo as {
      auditRefs: { id: string; weight: number }[];
    };
    seo.auditRefs.push({ id: 'new-seo-audit', weight: 1 });
    body.lighthouseResult.audits['new-seo-audit'] = {
      score: 0,
      scoreDisplayMode: 'binary',
    };

    const record = extractLighthouse(body)!;

    expect(record.unknownAudits).toEqual(['new-seo-audit']);
    expect(record.findings).toHaveLength(1);
  });

  /** Every accessibility audit is unread on purpose; naming them would warn on each answer. */
  it('names no accessibility audit as unknown', () => {
    const body = answer();
    const accessibility = body.lighthouseResult.categories.accessibility as {
      auditRefs: { id: string; weight: number }[];
    };
    accessibility.auditRefs.push({ id: 'new-a11y-audit', weight: 3 });

    expect(extractLighthouse(body)!.unknownAudits).toEqual([]);
  });

  it('reads the SEO and accessibility scores as whole numbers', () => {
    expect(extractLighthouse(answer())).toMatchObject({
      seoScore: 92,
      accessibilityScore: 94,
    });
  });

  /** The answers recorded before the app asked for the two categories (D20). */
  it('returns null for an answer without the SEO and accessibility categories', () => {
    expect(
      extractLighthouse(readPageSpeedFixture('url-field.json')),
    ).toBeNull();
  });

  it('returns null for a body that is not a PageSpeed result', () => {
    expect(extractLighthouse('not json at all')).toBeNull();
  });
});
