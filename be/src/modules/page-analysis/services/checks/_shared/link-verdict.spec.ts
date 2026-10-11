import { SEO_ISSUE_CATALOGUE } from '@app/contracts';
import type { TOutboundOutcome } from '../../../interfaces/outbound-facts.interface';
import { EXTERNAL_BROKEN_STATUSES, linkVerdictOf } from './link-verdict';

const answered = (status: number, hops = 0): TOutboundOutcome => ({
  kind: 'answered',
  status,
  redirects: Array.from({ length: hops }, (_, n) => ({
    url: `https://a.example/hop-${n}/`,
    status: 301,
  })),
  finalUrl: 'https://a.example/final/',
});
const failed = (
  failure: Extract<TOutboundOutcome, { kind: 'failed' }>['failure'],
): TOutboundOutcome => ({ kind: 'failed', failure });

describe('linkVerdictOf', () => {
  // Plan §10.1, row by row: [outcome, internal verdict, external verdict].
  it.each([
    ['a 200', answered(200), 'fine', 'fine'],
    ['a redirect to a 200', answered(200, 1), 'redirects', 'fine'],
    ['a 404', answered(404), 'broken', 'broken'],
    ['a 410', answered(410), 'broken', 'broken'],
    ['a redirect to a 404', answered(404, 2), 'broken', 'broken'],
    ['a 500', answered(500), 'broken', 'unknown'],
    ['no such domain', failed('nxdomain'), 'broken', 'broken'],
    ['a redirect loop', failed('tooManyRedirects'), 'broken', 'unknown'],
    ['a timeout', failed('timeout'), 'unknown', 'unknown'],
    ['a network failure', failed('network'), 'unknown', 'unknown'],
    ['a private address', failed('forbiddenAddress'), 'unknown', 'unknown'],
    [
      'a link not checked',
      { kind: 'unchecked', reason: 'budget' } as const,
      'unknown',
      'unknown',
    ],
  ])(
    '%s is %s inside the site and %s outside it',
    (_, outcome, inside, outside) => {
      expect(linkVerdictOf(outcome, true)).toBe(inside);
      expect(linkVerdictOf(outcome, false)).toBe(outside);
    },
  );

  // Anti-bot walls answer crawlers what they never answer readers (plan D3).
  it.each([401, 403, 429, 999, 500, 503])(
    'an external %d is unknown, never broken',
    (status) => {
      expect(linkVerdictOf(answered(status), false)).toBe('unknown');
    },
  );

  // Field audit, 2026-10-11 (plan O3): moz.com and css-tricks.com answered our own pace
  // with 429, and moz.com's checkout 403 — refusals of a crawler, not dead pages.
  it.each([401, 402, 403, 429])(
    'an internal %d refuses the crawler; it is unknown, not broken',
    (status) => {
      expect(linkVerdictOf(answered(status), true)).toBe('unknown');
    },
  );

  // backlinko.com/hub/… redirects to searchengineland.com, which walls crawlers off.
  it('an internal link that redirects off the site is judged by where it ends', () => {
    const offSite: TOutboundOutcome = {
      kind: 'answered',
      status: 403,
      redirects: [{ url: 'https://a.example/hub/x', status: 301 }],
      finalUrl: 'https://b.example/guide/x',
    };

    expect(linkVerdictOf(offSite, true)).toBe('unknown');
    expect(linkVerdictOf({ ...offSite, status: 404 }, true)).toBe('broken');
  });

  // youtube.com/@Ahrefs, 2026-10-11: through consent.youtube.com it ends on a 404 — a
  // cookie wall, not a missing channel. A detour through a third host proves nothing.
  it('a 404 reached through another host on the way is unknown', () => {
    expect(
      linkVerdictOf(
        {
          kind: 'answered',
          status: 404,
          redirects: [
            { url: 'https://www.youtube.com/@Ahrefs', status: 302 },
            { url: 'https://consent.youtube.com/m?continue=x', status: 303 },
          ],
          finalUrl: 'https://www.youtube.com/@Ahrefs?cbrd=1',
        },
        false,
      ),
    ).toBe('unknown');
  });

  // D25: the sentence and the constant cannot drift apart unnoticed.
  it('the BROKEN_LINKS explanation names every external broken status and says 403, 429 and 5xx are never reported', () => {
    const { explanation } = SEO_ISSUE_CATALOGUE.BROKEN_LINKS;
    for (const status of EXTERNAL_BROKEN_STATUSES)
      expect(explanation).toContain(String(status));
    expect(explanation).toMatch(/401, 403, 429/);
    expect(explanation).toMatch(/5xx/);
    expect(explanation).toMatch(/never reported/);
  });
});
