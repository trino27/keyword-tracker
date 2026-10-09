import { RobotsPolicy } from '@modules/crawl/services/robots-policy/robots-policy';
import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { ROBOTS_BLOCKS_RESOURCES_CHECK } from './robots-blocks-resources.check';

const robots = (text: string) =>
  RobotsPolicy.parse('https://a.example/robots.txt', text);

const loading = (renderResources: string[], rules: string) =>
  makeCheckInput({ parsed: { renderResources }, robots: robots(rules) });

describe('ROBOTS_BLOCKS_RESOURCES', () => {
  it('passes scripts and styles Googlebot may fetch', () => {
    expect(
      ROBOTS_BLOCKS_RESOURCES_CHECK.evaluate(
        loading(
          ['https://a.example/app.js', 'https://a.example/site.css'],
          'User-agent: *\nDisallow: /admin/\n',
        ),
      ),
    ).toEqual(PASSES);
  });

  // The pattern Google's JavaScript guide warns about: a whole asset folder disallowed.
  it('fails the blocked ones, each with the rule that blocks it', () => {
    const verdict = ROBOTS_BLOCKS_RESOURCES_CHECK.evaluate(
      loading(
        ['https://a.example/assets/app.js', 'https://a.example/site.css'],
        'User-agent: *\nDisallow: /assets/\n',
      ),
    );

    expect(verdict).toEqual(failsWith({ count: 1, total: 2 }));
    expect(evidenceOf(verdict)).toEqual([
      'https://a.example/assets/app.js — robots.txt line 2: Disallow: /assets/',
    ]);
  });

  // A CDN answers to its own robots.txt, which nobody read.
  it('cannot be judged when every resource is on another host', () => {
    expect(
      ROBOTS_BLOCKS_RESOURCES_CHECK.evaluate(
        loading(['https://cdn.example/app.js'], 'User-agent: *\nDisallow: /\n'),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  // ahrefs.com, 2026-10: `Disallow: /cdn-cgi/` keeps Cloudflare's e-mail decoder from
  // Googlebot, and the page renders the same without it.
  it("does not judge Cloudflare's own endpoints", () => {
    const rules = 'User-agent: *\nDisallow: /cdn-cgi/\n';
    const decoder =
      'https://a.example/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js';
    expect(
      ROBOTS_BLOCKS_RESOURCES_CHECK.evaluate(
        loading([decoder, 'https://a.example/app.js'], rules),
      ),
    ).toEqual(PASSES);
    expect(
      ROBOTS_BLOCKS_RESOURCES_CHECK.evaluate(loading([decoder], rules)),
    ).toEqual(NOT_APPLICABLE);
  });
});
