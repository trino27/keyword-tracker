import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { PER_MINUTE_THROTTLE } from '@core/constants/throttle.constant';
import { validateEnv } from '@infrastructure/config/env.schema/env.schema';
import { pinoHttpOptions } from '@infrastructure/observability/logger/_config/logger.config';
import { DatabaseModule } from '@persistence/connections/postgres/database.module';
import { AuthModule } from '@modules/auth/auth.module';
import { ClientsModule } from '@modules/clients/clients.module';
import { CrawlModule } from '@modules/crawl/crawl.module';
import { PagesModule } from '@modules/pages/pages.module';
import { PositionSeedService } from './position-seed/position-seed.service';
import { SeedRunner } from './seed-runner/seed-runner.service';

/**
 * The seed's own application context: the same modules the API uses — the same crawl,
 * the same analysis — without HTTP. Its crawl worker is started by `seed.ts`.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      validate: validateEnv,
    }),
    LoggerModule.forRoot({ pinoHttp: pinoHttpOptions }),
    ThrottlerModule.forRoot([PER_MINUTE_THROTTLE]),
    DatabaseModule,
    AuthModule,
    ClientsModule,
    PagesModule,
    CrawlModule,
  ],
  providers: [PositionSeedService, SeedRunner],
})
export class SeedModule {}
