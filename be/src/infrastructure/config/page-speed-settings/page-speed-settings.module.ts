import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvKeys } from '../env-keys.constant';
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
  ],
  exports: [PAGE_SPEED_SETTINGS, PageSpeedRuntimeState],
})
export class PageSpeedSettingsModule {}
