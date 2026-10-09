import { RobotsPolicy } from '@modules/crawl/services/robots-policy/robots-policy';
import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { ROBOTS_BLOCKS_AI_SEARCH_CHECK } from './robots-blocks-ai-search.check';

const withRobots = (text: string, finalUrl = 'https://a.example/post/') =>
  makeCheckInput({
    finalUrl,
    robots: RobotsPolicy.parse('https://a.example/robots.txt', text),
  });

describe('ROBOTS_BLOCKS_AI_SEARCH', () => {
  it('passes a page open to every AI search crawler', () => {
    expect(
      ROBOTS_BLOCKS_AI_SEARCH_CHECK.evaluate(
        withRobots('User-agent: *\nAllow: /\n'),
      ),
    ).toEqual(PASSES);
  });

  it('fails a search crawler shut out, quoting its rule', () => {
    const verdict = ROBOTS_BLOCKS_AI_SEARCH_CHECK.evaluate(
      withRobots(
        'User-agent: *\nAllow: /\n\nUser-agent: OAI-SearchBot\nDisallow: /\n',
      ),
    );

    expect(verdict).toEqual(failsWith({ crawlers: ['OAI-SearchBot'] }));
    expect(evidenceOf(verdict)).toEqual([
      'OAI-SearchBot: robots.txt line 5: Disallow: / — matches /post/',
    ]);
  });

  // Closing the training crawlers is a legitimate choice that costs no visibility.
  it('does not judge the training crawlers', () => {
    expect(
      ROBOTS_BLOCKS_AI_SEARCH_CHECK.evaluate(
        withRobots(
          'User-agent: GPTBot\nDisallow: /\n\nUser-agent: Google-Extended\nDisallow: /\n',
        ),
      ),
    ).toEqual(PASSES);
  });

  it('cannot be judged on a host the robots.txt does not govern', () => {
    expect(
      ROBOTS_BLOCKS_AI_SEARCH_CHECK.evaluate(
        withRobots(
          'User-agent: *\nDisallow: /\n',
          'https://blog.b.example/post/',
        ),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
