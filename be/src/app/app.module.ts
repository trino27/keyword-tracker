import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from '@infrastructure/config/env.schema/env.schema';
import { pinoHttpOptions } from '@infrastructure/observability/logger/_config/logger.config';

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
    LoggerModule.forRoot({ pinoHttp: pinoHttpOptions }),
  ],
})
export class AppModule {}
