import { PageSpeedRuntimeState } from '../page-speed-runtime-state';
import { PageSpeedAvailabilityService } from './page-speed-availability.service';

describe('PageSpeedAvailabilityService', () => {
  it('answers from the configured key and what the worker learned since', () => {
    const runtime = new PageSpeedRuntimeState();
    const service = new PageSpeedAvailabilityService({ apiKey: 'k' }, runtime);

    expect(service.current()).toEqual({ state: 'active' });
    runtime.markKeyRejected();
    expect(service.current()).toEqual({ state: 'keyRejected' });
  });
});
