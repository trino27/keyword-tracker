import {
  PageSpeedRateLimiter,
  type IRateLimiterClock,
} from './page-speed-rate-limiter';

/** Time moves only when someone sleeps, so every wait is recorded exactly. */
const fakeClock = () => {
  let now = 1_000_000;
  const sleeps: number[] = [];
  const clock: IRateLimiterClock = {
    now: () => now,
    sleep: (ms, signal) => {
      if (signal.aborted) return Promise.resolve();
      sleeps.push(ms);
      now += ms;
      return Promise.resolve();
    },
  };
  return { clock, sleeps, advance: (ms: number) => (now += ms) };
};

describe('PageSpeedRateLimiter', () => {
  it('spaces requests by the minimum interval', async () => {
    const { clock, sleeps } = fakeClock();
    const limiter = new PageSpeedRateLimiter(clock);

    const turns = await Promise.all([
      limiter.acquire(),
      limiter.acquire(),
      limiter.acquire(),
    ]);

    expect(turns).toEqual([true, true, true]);
    expect(sleeps).toEqual([1_000, 1_000]);
  });

  it('does not wait when the interval has already passed', async () => {
    const { clock, sleeps, advance } = fakeClock();
    const limiter = new PageSpeedRateLimiter(clock);

    await limiter.acquire();
    advance(5_000);
    await limiter.acquire();

    expect(sleeps).toEqual([]);
  });

  it('a pause holds every slot', async () => {
    const { clock, sleeps } = fakeClock();
    const limiter = new PageSpeedRateLimiter(clock);

    limiter.pause(120_000);
    await Promise.all([limiter.acquire(), limiter.acquire()]);

    expect(sleeps).toEqual([120_000, 1_000]);
  });

  it('keeps the longer of two pauses', async () => {
    const { clock, sleeps } = fakeClock();
    const limiter = new PageSpeedRateLimiter(clock);

    limiter.pause(120_000);
    limiter.pause(60_000);
    await limiter.acquire();

    expect(sleeps).toEqual([120_000]);
  });

  it('a halt stops every slot, waiting or not', async () => {
    const { clock } = fakeClock();
    const limiter = new PageSpeedRateLimiter(clock);

    limiter.halt();

    expect(await Promise.all([limiter.acquire(), limiter.acquire()])).toEqual([
      false,
      false,
    ]);
    expect(limiter.isHalted).toBe(true);
  });

  it('a caller that stops waiting gets no turn', async () => {
    const { clock } = fakeClock();
    const limiter = new PageSpeedRateLimiter(clock);
    const controller = new AbortController();
    controller.abort();

    expect(await limiter.acquire(controller.signal)).toBe(false);
  });
});
