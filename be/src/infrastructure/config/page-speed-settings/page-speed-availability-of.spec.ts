import { pageSpeedAvailabilityOf } from './page-speed-availability-of';
import { PageSpeedRuntimeState } from './page-speed-runtime-state';

describe('pageSpeedAvailabilityOf', () => {
  it('no key is notConfigured, a key is active, a rejected key is keyRejected', () => {
    const runtime = new PageSpeedRuntimeState();

    expect(pageSpeedAvailabilityOf({ apiKey: null }, runtime)).toEqual({
      state: 'notConfigured',
    });
    expect(pageSpeedAvailabilityOf({ apiKey: 'k' }, runtime)).toEqual({
      state: 'active',
    });

    runtime.markKeyRejected();

    expect(pageSpeedAvailabilityOf({ apiKey: 'k' }, runtime)).toEqual({
      state: 'keyRejected',
    });
  });

  /** Without a key there is nothing to reject; the absence is the truer sentence. */
  it('no key stays notConfigured even after a rejection was recorded', () => {
    const runtime = new PageSpeedRuntimeState();
    runtime.markKeyRejected();

    expect(pageSpeedAvailabilityOf({ apiKey: null }, runtime)).toEqual({
      state: 'notConfigured',
    });
  });
});
