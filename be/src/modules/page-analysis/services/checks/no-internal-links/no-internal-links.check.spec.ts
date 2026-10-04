import { failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { NO_INTERNAL_LINKS_CHECK } from './no-internal-links.check';

const withLinks = (...links: string[]) => makeCheckInput({ parsed: { links } });

describe('NO_INTERNAL_LINKS', () => {
  it('passes on one link to the same site', () => {
    expect(
      NO_INTERNAL_LINKS_CHECK.evaluate(withLinks('https://a.example/other/')),
    ).toEqual(PASSES);
  });

  it('counts the outbound links it found instead', () => {
    expect(
      NO_INTERNAL_LINKS_CHECK.evaluate(
        withLinks('https://b.example/x', 'https://c.example/y'),
      ),
    ).toEqual(failsWith({ external: 2 }));
  });

  it('fails a page whose content links nowhere at all', () => {
    expect(NO_INTERNAL_LINKS_CHECK.evaluate(withLinks())).toEqual(
      failsWith({ external: 0 }),
    );
  });

  // The same site written both ways is one site. A theme that links its own pages with
  // the prefix, on a site reached without it, would otherwise be reported as linking
  // nowhere — a finding about the host string, not about the page.
  it('reads www and the bare host as one site', () => {
    expect(
      NO_INTERNAL_LINKS_CHECK.evaluate(
        withLinks('https://www.a.example/other/'),
      ),
    ).toEqual(PASSES);
  });

  // A subdomain is another site: links to it do not carry a reader deeper into this one.
  it('does not count a subdomain as the same site', () => {
    expect(
      NO_INTERNAL_LINKS_CHECK.evaluate(withLinks('https://shop.a.example/x')),
    ).toEqual(failsWith({ external: 1 }));
  });
});
