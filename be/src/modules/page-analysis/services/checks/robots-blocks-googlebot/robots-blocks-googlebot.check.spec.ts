import { RobotsPolicy } from '@modules/crawl/services/robots-policy/robots-policy';
import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { ROBOTS_BLOCKS_GOOGLEBOT_CHECK } from './robots-blocks-googlebot.check';

const robots = (text: string) =>
  RobotsPolicy.parse('https://a.example/robots.txt', text);

describe('ROBOTS_BLOCKS_GOOGLEBOT', () => {
  it('passes a page robots.txt leaves open to Googlebot', () => {
    expect(
      ROBOTS_BLOCKS_GOOGLEBOT_CHECK.evaluate(
        makeCheckInput({
          robots: robots('User-agent: *\nDisallow: /admin/\n'),
        }),
      ),
    ).toEqual(PASSES);
  });

  // The case the crawl itself cannot see: the wildcard group let this tracker in, and
  // the group addressed to Googlebot shuts Google out.
  it('fails a page closed to Googlebot alone, quoting the rule', () => {
    const verdict = ROBOTS_BLOCKS_GOOGLEBOT_CHECK.evaluate(
      makeCheckInput({
        robots: robots(
          'User-agent: *\nAllow: /\n\nUser-agent: Googlebot\nDisallow: /post/\n',
        ),
      }),
    );

    expect(verdict).toEqual(
      failsWith({
        url: 'https://a.example/post/',
        rule: 'line 5: Disallow: /post/',
      }),
    );
    expect(evidenceOf(verdict)).toEqual([
      'robots.txt line 5: Disallow: /post/ — matches /post/ for Googlebot',
    ]);
  });

  it('passes when the site has no robots.txt at all', () => {
    expect(
      ROBOTS_BLOCKS_GOOGLEBOT_CHECK.evaluate(
        makeCheckInput({ robots: RobotsPolicy.allowAll() }),
      ),
    ).toEqual(PASSES);
  });

  it('cannot be judged on a host the robots.txt does not govern', () => {
    expect(
      ROBOTS_BLOCKS_GOOGLEBOT_CHECK.evaluate(
        makeCheckInput({
          finalUrl: 'https://blog.b.example/post/',
          robots: robots('User-agent: *\nDisallow: /\n'),
        }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
