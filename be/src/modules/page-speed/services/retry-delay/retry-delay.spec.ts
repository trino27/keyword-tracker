import { retryDelayMs } from './retry-delay';

describe('retryDelayMs', () => {
  it('waits 1, 4, 16, 64 minutes after the 1st to 4th failure', () => {
    expect([1, 2, 3, 4].map(retryDelayMs)).toEqual([
      60_000, 240_000, 960_000, 3_840_000,
    ]);
  });
});
