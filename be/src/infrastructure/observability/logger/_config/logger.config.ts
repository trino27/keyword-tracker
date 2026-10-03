import pino from 'pino';
import type { Params as PinoModuleParams } from 'nestjs-pino';
import { SERVICE_NAME } from '../constants/logger.constant';
import { REDACT_CENSOR, REDACT_PATHS } from './redact/redact.config';

const isProd = process.env.NODE_ENV === 'production';
const level = process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug');

/** Pretty output for a developer's terminal, JSON lines everywhere else. */
const transport: pino.TransportSingleOptions | undefined = isProd
  ? undefined
  : {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss.l',
        ignore: 'pid,hostname',
      },
    };

export const pinoHttpOptions: PinoModuleParams['pinoHttp'] = {
  level,
  base: { service: SERVICE_NAME },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: { paths: [...REDACT_PATHS], censor: REDACT_CENSOR },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  // The health probe runs every few seconds; logging it buries everything else.
  autoLogging: { ignore: (req) => req.url?.endsWith('/health') ?? false },
  transport,
};

export const loggerLevel = level;
export const loggerTransport = transport;
