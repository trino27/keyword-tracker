import { RobotsPolicy } from '../robots-policy/robots-policy';
import { HostRobotsCache, type TFetchRobots } from './host-robots-cache';

const signal = () => AbortSignal.timeout(1_000);

const answering =
  (answers: Record<string, { status: number; text?: string }>): TFetchRobots =>
  (origin) => {
    const answer = answers[origin];
    if (!answer) return Promise.reject(new Error('ECONNREFUSED'));
    return Promise.resolve({ text: '', headers: {}, ...answer });
  };

describe('HostRobotsCache', () => {
  const own = RobotsPolicy.parse(
    'https://a.example/robots.txt',
    'User-agent: *\nDisallow: /private/',
  );

  it("answers the run's own origin from the run's robots.txt, without a request", async () => {
    const fetchRobots = jest.fn(answering({}));
    const cache = new HostRobotsCache('https://a.example', own, fetchRobots);

    const policy = await cache.policyFor('https://a.example', signal());

    expect(policy?.isAllowed('https://a.example/private/x')).toBe(false);
    expect(fetchRobots).not.toHaveBeenCalled();
  });

  it("fetches each external host's robots.txt once, however many ask at once", async () => {
    const fetchRobots = jest.fn(
      answering({
        'https://b.example': {
          status: 200,
          text: 'User-agent: *\nDisallow: /no/',
        },
      }),
    );
    const cache = new HostRobotsCache('https://a.example', own, fetchRobots);

    const [first, second] = await Promise.all([
      cache.policyFor('https://b.example', signal()),
      cache.policyFor('https://b.example', signal()),
    ]);
    await cache.policyFor('https://b.example', signal());

    expect(fetchRobots).toHaveBeenCalledTimes(1);
    expect(first?.isAllowed('https://b.example/no/page')).toBe(false);
    expect(second?.isAllowed('https://b.example/yes/')).toBe(true);
  });

  // RFC 9309: a 4xx robots.txt means no rules; an unreachable one means disallow.
  it('a 4xx robots.txt allows the host; a 5xx, a 429 or no answer disallows it', async () => {
    const cache = new HostRobotsCache(
      'https://a.example',
      own,
      answering({
        'https://gone.example': { status: 404 },
        'https://down.example': { status: 503 },
        'https://busy.example': { status: 429 },
      }),
    );

    expect(
      (await cache.policyFor('https://gone.example', signal()))?.isAllowed(
        'https://gone.example/x',
      ),
    ).toBe(true);
    await expect(
      cache.policyFor('https://down.example', signal()),
    ).resolves.toBeNull();
    await expect(
      cache.policyFor('https://busy.example', signal()),
    ).resolves.toBeNull();
    await expect(
      cache.policyFor('https://unreachable.example', signal()),
    ).resolves.toBeNull();
  });

  it('a bot challenge on robots.txt disallows the host', async () => {
    const cache = new HostRobotsCache('https://a.example', own, () =>
      Promise.resolve({
        status: 403,
        text: '',
        headers: { 'cf-mitigated': 'challenge' },
      }),
    );

    await expect(
      cache.policyFor('https://walled.example', signal()),
    ).resolves.toBeNull();
  });
});
