import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvKeys } from '../env-keys.constant';
import { PageSpeedAvailabilityService } from './page-speed-availability/page-speed-availability.service';
import { PageSpeedRuntimeState } from './page-speed-runtime-state';
import { PAGE_SPEED_SETTINGS } from './page-speed-settings';
import { pageSpeedSettingsFrom } from './page-speed-settings-of/page-speed-settings-of';

/** The PageSpeed key and what the worker learned about it, for every module to read. */
@Global()
@Module({
  providers: [
    {
      provide: PAGE_SPEED_SETTINGS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        pageSpeedSettingsFrom(config.get<string>(EnvKeys.PAGESPEED_API_KEY)),
    },
    PageSpeedRuntimeState,
    PageSpeedAvailabilityService,
  ],
  exports: [
    PAGE_SPEED_SETTINGS,
    PageSpeedRuntimeState,
    PageSpeedAvailabilityService,
  ],
})
export class PageSpeedSettingsModule {}
