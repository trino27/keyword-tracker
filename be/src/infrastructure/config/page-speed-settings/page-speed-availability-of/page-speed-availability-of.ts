import type { IPageSpeedAvailability } from '@app/contracts';
import type { IPageSpeedSettings } from '../page-speed-settings';
import type { PageSpeedRuntimeState } from '../page-speed-runtime-state';

/**
 * The one answer every read path gives about PageSpeed. A process with a key but the
 * worker flag off still says `active`: the key is good as far as anyone knows, and the
 * queue drains wherever the worker does run.
 */
export function pageSpeedAvailabilityOf(
  settings: IPageSpeedSettings,
  runtime: PageSpeedRuntimeState,
): IPageSpeedAvailability {
  if (settings.apiKey === null) return { state: 'notConfigured' };
  return { state: runtime.keyRejected ? 'keyRejected' : 'active' };
}
