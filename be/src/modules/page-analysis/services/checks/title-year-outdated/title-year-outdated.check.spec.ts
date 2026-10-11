import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { TITLE_YEAR_OUTDATED_CHECK } from './title-year-outdated.check';

const titled = (
  title: string | null,
  fetchedAt = '2026-10-09T12:00:00Z',
  timeZone = 'America/Toronto',
) =>
  makeCheckInput({
    fetchedAt: new Date(fetchedAt),
    timeZone,
    parsed: { title },
  });

describe('TITLE_YEAR_OUTDATED', () => {
  it('fails a title still selling last year', () => {
    const verdict = TITLE_YEAR_OUTDATED_CHECK.evaluate(
      titled('Best SEO tools for 2025 | Acme'),
    );

    expect(verdict).toEqual(failsWith({ year: 2025, currentYear: 2026 }));
    expect(evidenceOf(verdict)).toEqual([
      'The title says 2025; it is 2026.',
      '<title>Best SEO tools for 2025 | Acme</title>',
    ]);
  });

  it('fails a past year that ends the title', () => {
    expect(
      TITLE_YEAR_OUTDATED_CHECK.evaluate(titled('The SEO checklist (2024)')),
    ).toEqual(failsWith({ year: 2024 }));
  });

  it('reads a Russian preposition', () => {
    expect(
      TITLE_YEAR_OUTDATED_CHECK.evaluate(titled('Тренды SEO в 2025 году')),
    ).toEqual(failsWith({ year: 2025 }));
  });

  it('passes the current year', () => {
    expect(
      TITLE_YEAR_OUTDATED_CHECK.evaluate(titled('SEO guide for 2026')),
    ).toEqual(PASSES);
  });

  it('turns the year at the owner’s midnight, not UTC’s', () => {
    // 00:30 on 1 January in Toronto: already 2026 there.
    expect(
      TITLE_YEAR_OUTDATED_CHECK.evaluate(
        titled('Guide 2026', '2026-01-01T05:30:00Z'),
      ),
    ).toEqual(PASSES);
    // 23:30 on 31 December in Toronto, 1 January in UTC: still 2026 for the owner.
    expect(
      TITLE_YEAR_OUTDATED_CHECK.evaluate(
        titled('SEO guide 2026', '2027-01-01T04:30:00Z'),
      ),
    ).toEqual(PASSES);
    expect(
      TITLE_YEAR_OUTDATED_CHECK.evaluate(
        titled('SEO guide 2026', '2027-01-01T04:30:00Z', 'UTC'),
      ),
    ).toEqual(failsWith({ year: 2026, currentYear: 2027 }));
  });

  it('passes years that neither end the title nor follow a preposition', () => {
    expect(
      TITLE_YEAR_OUTDATED_CHECK.evaluate(
        titled('2024 vs 2025: what changed for small sites'),
      ),
    ).toEqual(PASSES);
  });

  it('does not read a year in the site name after the separator', () => {
    expect(
      TITLE_YEAR_OUTDATED_CHECK.evaluate(
        titled('Link building basics | Studio 2019'),
      ),
    ).toEqual(PASSES);
  });

  it('does not read the site name before the separator when the page names its site', () => {
    expect(
      TITLE_YEAR_OUTDATED_CHECK.evaluate(
        makeCheckInput({
          fetchedAt: new Date('2026-10-09T12:00:00Z'),
          parsed: {
            title: 'Studio 2019 | Link building basics',
            openGraph: { 'og:site_name': 'Studio 2019' },
          },
        }),
      ),
    ).toEqual(PASSES);
  });

  it('reads a year that is the last part of the title', () => {
    expect(
      TITLE_YEAR_OUTDATED_CHECK.evaluate(titled('Best SEO Tools – 2025')),
    ).toEqual(failsWith({ year: 2025 }));
  });

  it('reads the post before a site name that comes first', () => {
    expect(
      TITLE_YEAR_OUTDATED_CHECK.evaluate(
        makeCheckInput({
          fetchedAt: new Date('2026-10-09T12:00:00Z'),
          parsed: {
            title: 'Acme | Best SEO tools for 2025',
            openGraph: { 'og:site_name': 'Acme' },
          },
        }),
      ),
    ).toEqual(failsWith({ year: 2025 }));
  });

  it('is not applicable without a title', () => {
    expect(TITLE_YEAR_OUTDATED_CHECK.evaluate(titled(null))).toEqual(
      NOT_APPLICABLE,
    );
  });
});
