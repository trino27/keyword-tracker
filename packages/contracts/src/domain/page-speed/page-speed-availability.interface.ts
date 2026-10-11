import type { TPageSpeedAvailabilityState } from './page-speed-availability-state.enum.js';

/** One fact, carried by the list, the detail and the report under one name. */
export interface IPageSpeedAvailability {
  state: TPageSpeedAvailabilityState;
}
