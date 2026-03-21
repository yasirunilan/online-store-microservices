import { LoggerService } from '@nestjs/common';
import pino, { Logger } from 'pino';
import { loggerStorage } from './logger.context';

// process.env is read directly here — intentional exception for a package-level
// utility that cannot go through a service's Zod config object.
function createPinoInstance(): Logger {
  const isDev = process.env.NODE_ENV !== 'production';
  return pino({
    level: process.env.LOG_LEVEL ?? 'info',
    base: { service: process.env.SERVICE_NAME ?? 'unknown' },
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: isDev
      ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
      : undefined,
  });
}

export class PinoLoggerService implements LoggerService {
  private readonly pino: Logger = createPinoInstance();

  private context(): object {
    return loggerStorage.getStore() ?? {};
  }

  log(message: string, context?: string): void {
    this.pino.info({ ...this.context(), context }, message);
  }

  error(message: string, trace?: string, context?: string): void {
    this.pino.error({ ...this.context(), context, trace }, message);
  }

  warn(message: string, context?: string): void {
    this.pino.warn({ ...this.context(), context }, message);
  }

  debug(message: string, context?: string): void {
    this.pino.debug({ ...this.context(), context }, message);
  }

  verbose(message: string, context?: string): void {
    this.pino.trace({ ...this.context(), context }, message);
  }

  fatal(message: string, context?: string): void {
    this.pino.fatal({ ...this.context(), context }, message);
  }
}
