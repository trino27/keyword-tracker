import { Inject, Injectable } from '@nestjs/common';
import type { IPageSpeedAvailability } from '@app/contracts';
import { pageSpeedAvailabilityOf } from '../page-speed-availability-of/page-speed-availability-of';
import { PageSpeedRuntimeState } from '../page-speed-runtime-state';
import {
  PAGE_SPEED_SETTINGS,
  type IPageSpeedSettings,
} from '../page-speed-settings';

/**
 * What every read path says about PageSpeed, asked in one place: the list, the detail
 * and the report inject this rather than the key and the runtime state separately.
 */
@Injectable()
export class PageSpeedAvailabilityService {
  constructor(
    @Inject(PAGE_SPEED_SETTINGS) private readonly settings: IPageSpeedSettings,
    private readonly runtime: PageSpeedRuntimeState,
  ) {}

  current(): IPageSpeedAvailability {
    return pageSpeedAvailabilityOf(this.settings, this.runtime);
  }
}
