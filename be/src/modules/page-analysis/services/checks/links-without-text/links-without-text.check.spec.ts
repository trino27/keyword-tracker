import { evidenceOf, failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { LINKS_WITHOUT_TEXT_CHECK } from './links-without-text.check';

const withUnnamed = (...hrefs: string[]) =>
  makeCheckInput({
    parsed: {
      unnamedLinks: hrefs.map((href) => ({
        href,
        markup: `<a href="${href}"><img src="icon.svg"></a>`,
      })),
    },
  });

describe('LINKS_WITHOUT_TEXT', () => {
  it('passes a page whose links all have words', () => {
    expect(LINKS_WITHOUT_TEXT_CHECK.evaluate(withUnnamed())).toEqual(PASSES);
  });

  it('fails a nameless link to this site, quoting it', () => {
    const verdict = LINKS_WITHOUT_TEXT_CHECK.evaluate(
      withUnnamed('https://a.example/pricing/'),
    );

    expect(verdict).toEqual(failsWith({ count: 1 }));
    expect(evidenceOf(verdict)).toEqual([
      '<a href="https://a.example/pricing/"><img src="icon.svg"></a>',
    ]);
  });

  // Recorded on every semrush post: icon-only share buttons to social networks. The
  // anchor describes another site's page, which is that site's concern.
  it('leaves nameless links to other sites alone', () => {
    expect(
      LINKS_WITHOUT_TEXT_CHECK.evaluate(
        withUnnamed('https://linkedin.com/sharing/share-offsite?url=x'),
      ),
    ).toEqual(PASSES);
  });
});
