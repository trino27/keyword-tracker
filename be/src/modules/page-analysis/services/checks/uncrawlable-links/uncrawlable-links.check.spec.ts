import { evidenceOf, failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { UNCRAWLABLE_LINKS_CHECK } from './uncrawlable-links.check';

describe('UNCRAWLABLE_LINKS', () => {
  it('passes a page whose links all have a real href', () => {
    expect(UNCRAWLABLE_LINKS_CHECK.evaluate(makeCheckInput())).toEqual(PASSES);
  });

  it('fails and quotes each link a crawler cannot follow', () => {
    const links = [
      `<a onclick="goTo('/pricing/')">See pricing</a>`,
      '<a href="javascript:void(0)">Read more</a>',
    ];
    const verdict = UNCRAWLABLE_LINKS_CHECK.evaluate(
      makeCheckInput({ parsed: { uncrawlableLinks: links } }),
    );

    expect(verdict).toEqual(failsWith({ count: 2 }));
    expect(evidenceOf(verdict)).toEqual(links);
  });
});
