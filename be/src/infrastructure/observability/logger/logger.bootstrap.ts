import pino, { type Logger } from 'pino';
import { SERVICE_NAME } from './constants/logger.constant';
import { loggerLevel, loggerTransport } from './_config/logger.config';
import { REDACT_CENSOR, REDACT_PATHS } from './_config/redact/redact.config';

/**
 * The logger for code that runs outside Nest's DI container — bootstrap, factory
 * providers, the migration and seed CLIs. Same level, redaction and format as the
 * request logger, so a line reads the same whichever path wrote it.
 *
 * Inside an injectable, use `@InjectPinoLogger(Class.name)` instead.
 */
export const bootstrapLogger: Logger = pino({
  level: loggerLevel,
  base: { service: SERVICE_NAME },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: { paths: [...REDACT_PATHS], censor: REDACT_CENSOR },
  serializers: { err: pino.stdSerializers.err },
  transport: loggerTransport,
});
