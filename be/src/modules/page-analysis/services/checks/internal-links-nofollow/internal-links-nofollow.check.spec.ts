import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { INTERNAL_LINKS_NOFOLLOW_CHECK } from './internal-links-nofollow.check';

const withLinks = (links: string[], nofollowLinks: string[] = []) =>
  makeCheckInput({ parsed: { links, nofollowLinks } });

describe('INTERNAL_LINKS_NOFOLLOW', () => {
  it('passes internal links that carry no nofollow', () => {
    expect(
      INTERNAL_LINKS_NOFOLLOW_CHECK.evaluate(
        withLinks(['https://a.example/other/']),
      ),
    ).toEqual(PASSES);
  });

  // Recorded on yoast.com: an add-to-cart link inside a post, marked nofollow.
  it('fails an internal link marked nofollow, quoting it', () => {
    const cart = 'https://a.example/cart?add-to-cart=1';
    const verdict = INTERNAL_LINKS_NOFOLLOW_CHECK.evaluate(
      withLinks(['https://a.example/other/', cart], [cart]),
    );

    expect(verdict).toEqual(failsWith({ count: 1, total: 2 }));
    expect(evidenceOf(verdict)).toEqual([`<a href="${cart}" rel="nofollow">`]);
  });

  // nofollow on an outbound link is exactly what the attribute is for.
  it('ignores nofollow on links to other sites', () => {
    expect(
      INTERNAL_LINKS_NOFOLLOW_CHECK.evaluate(
        withLinks(
          ['https://a.example/other/', 'https://b.example/'],
          ['https://b.example/'],
        ),
      ),
    ).toEqual(PASSES);
  });

  // wpbeginner.com and minimalistbaker.com, 2026-10: an affiliate redirect under
  // /refer/ and a recipe's print copy, both nofollow on purpose, were reported; the
  // nofollow on the same post's link to /garlic-mac-n-cheese/ still is reported.
  it('leaves affiliate redirects and print copies alone', () => {
    const own = 'https://a.example/garlic-mac-n-cheese/';
    const kept = [
      'https://www.a.example/refer/bluehost/',
      'https://a.example/go/hosting',
      'https://a.example/wprm_print/the-best-mac-n-cheese',
      'https://a.example/post/print/',
    ];
    const verdict = INTERNAL_LINKS_NOFOLLOW_CHECK.evaluate(
      withLinks([own, ...kept], [own, ...kept]),
    );

    expect(verdict).toEqual(failsWith({ count: 1 }));
    expect(evidenceOf(verdict)).toEqual([`<a href="${own}" rel="nofollow">`]);
  });

  // `/blueprint/` and `/gorilla/` are pages, not redirects or print copies.
  it('still reads ordinary pages as pages', () => {
    const pages = [
      'https://a.example/blueprint/',
      'https://a.example/gorilla/',
    ];
    expect(
      INTERNAL_LINKS_NOFOLLOW_CHECK.evaluate(withLinks(pages, pages)),
    ).toEqual(failsWith({ count: 2 }));
  });

  it('cannot be judged without internal links', () => {
    expect(
      INTERNAL_LINKS_NOFOLLOW_CHECK.evaluate(
        withLinks(['https://b.example/'], ['https://b.example/']),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
