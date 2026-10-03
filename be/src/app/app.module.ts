import { Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { APP_GLOBAL_PROVIDERS } from '@core/bootstrap/app-globals.providers';
import { validateEnv } from '@infrastructure/config/env.schema/env.schema';
import { pinoHttpOptions } from '@infrastructure/observability/logger/_config/logger.config';
import { DatabaseModule } from '@persistence/connections/postgres/database.module';
import { AuthModule } from '@modules/auth/auth.module';
import { LOGIN_THROTTLE } from '@modules/auth/constants/throttle.constant';
import { HealthModule } from '@modules/health/health.module';

@Module({
  imports: [
    // Values come from the process environment: docker compose supplies them in a
    // container, `dotenv -e ../.env` does on a developer machine. No env file is
    // read here, so there is exactly one place a value can come from per runtime.
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      validate: validateEnv,
    }),
    LoggerModule.forRoot({
      pinoHttp: pinoHttpOptions,
      // Named wildcard: the default `*` is legacy syntax for path-to-regexp v8.
      forRoutes: [{ path: '{*path}', method: RequestMethod.ALL }],
    }),
    // In-memory counters; applied per route by the throttler guards, never globally.
    ThrottlerModule.forRoot([LOGIN_THROTTLE]),
    DatabaseModule,
    HealthModule,
    AuthModule,
  ],
  providers: [...APP_GLOBAL_PROVIDERS],
})
export class AppModule {}
