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

  it('cannot be judged without internal links', () => {
    expect(
      INTERNAL_LINKS_NOFOLLOW_CHECK.evaluate(
        withLinks(['https://b.example/'], ['https://b.example/']),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
