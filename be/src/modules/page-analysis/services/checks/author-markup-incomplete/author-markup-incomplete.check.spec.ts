import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import type { IMarkupAuthor } from '../../../interfaces/parsed-page.interface';
import { AUTHOR_MARKUP_INCOMPLETE_CHECK } from './author-markup-incomplete.check';

const person = (overrides: Partial<IMarkupAuthor> = {}): IMarkupAuthor => ({
  name: 'Jane Doe',
  type: 'Person',
  urls: ['https://a.example/author/jane-doe/'],
  asText: false,
  ...overrides,
});

const verdict = (authors: IMarkupAuthor[]) =>
  AUTHOR_MARKUP_INCOMPLETE_CHECK.evaluate(
    makeCheckInput({
      parsed: {
        articleMarkup: {
          ...makeCheckInput().parsed.articleMarkup!,
          authors,
        },
      },
    }),
  );

describe('AUTHOR_MARKUP_INCOMPLETE', () => {
  it('passes a Person with a profile page', () => {
    expect(verdict([person()])).toEqual(PASSES);
  });

  it('passes an Organization subtype as author', () => {
    expect(
      verdict([
        person({ name: 'Smith & Partners', type: 'NewsMediaOrganization' }),
      ]),
    ).toEqual(PASSES);
  });

  // yoast.com, 2026-10: sameAs opens with the site, then names the author's profiles.
  /**
   * Google: author.url is "a web page that uniquely identifies the author". An
   * organization's home page does, and so does a person's own site; only the home page
   * of the site the article is on says nothing about who wrote it.
   */
  it("passes an organization's home page, and a person's own site", () => {
    expect(
      verdict([
        {
          name: 'Acme',
          type: 'Organization',
          urls: ['https://acme.example/'],
          asText: false,
        },
      ]),
    ).toEqual(PASSES);
    expect(verdict([person({ urls: ['https://janedoe.example/'] })])).toEqual(
      PASSES,
    );
  });

  it('passes a sameAs list that names the author after a home page', () => {
    expect(
      verdict([
        person({
          urls: [
            'https://yoast.com/',
            'https://www.linkedin.com/in/mariekerakt',
          ],
        }),
      ]),
    ).toEqual(PASSES);
  });

  it('fails an author given as a bare string (gazeta.uz)', () => {
    const result = verdict([
      { name: 'Gazeta', type: null, urls: [], asText: true },
    ]);
    expect(evidenceOf(result)).toEqual([
      'author "Gazeta" — a bare string, with no @type and no url to read more',
    ]);
  });

  // habr.com, 2026-10: "author": {"@type": "Person", "name": null}.
  it('fails an author with no name', () => {
    expect(evidenceOf(verdict([person({ name: null, urls: [] })]))).toEqual([
      'author with no name — no url or sameAs, no name',
    ]);
  });

  it.each([
    [person({ urls: [] }), 'no url or sameAs'],
    [person({ type: null }), 'no @type'],
    [person({ type: 'Thing' }), '@type Thing, not Person or Organization'],
    [
      person({ urls: ['https://a.example/'] }),
      'url https://a.example/ is a home page, not a page about the author',
    ],
    [person({ name: 'By Jane Doe' }), 'a prefix in name'],
    // Google lists "Honorific prefix or suffix" among what name must not carry.
    [person({ name: 'Dr. Peter J. Meyers' }), 'an honorific in name'],
    [
      person({ name: 'Dana @ Minimalist Baker' }),
      'the publisher written into name',
    ],
    [
      person({ name: 'Jane Doe and John Roe' }),
      'name reads as several people or carries a title',
    ],
    [
      person({ name: 'Jane Doe, PhD' }),
      'name reads as several people or carries a title',
    ],
  ])('fails %#: %s', (author, problem) => {
    const result = verdict([author]);
    expect(result).toEqual(failsWith({ count: 1, total: 1 }));
    expect(evidenceOf(result)[0]).toContain(problem);
  });

  it('counts each faulty author of several', () => {
    expect(verdict([person(), person({ name: 'John Roe', urls: [] })])).toEqual(
      failsWith({ count: 1, total: 2 }),
    );
  });

  it('cannot be judged when the markup names no author', () => {
    expect(verdict([])).toEqual(NOT_APPLICABLE);
    expect(
      AUTHOR_MARKUP_INCOMPLETE_CHECK.evaluate(
        makeCheckInput({ parsed: { articleMarkup: null } }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  // habr.com, 2026-10: a nameless Person is the only author the page has, which is
  // AUTHOR_MISSING's finding; this check does not say it again.
  it('leaves a page that names no author at all to AUTHOR_MISSING', () => {
    expect(
      AUTHOR_MARKUP_INCOMPLETE_CHECK.evaluate(
        makeCheckInput({
          parsed: {
            authors: [],
            articleMarkup: {
              ...makeCheckInput().parsed.articleMarkup!,
              authors: [person({ name: null, urls: [] })],
            },
          },
        }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
