import pino from 'pino';
import type { Logger } from '../types/index.js';

let loggerInstance: pino.Logger | null = null;

export function createLogger(level: string = 'info'): Logger {
  if (!loggerInstance) {
    loggerInstance = pino({
      level,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  return {
    debug: (msg: string, data?: object) => loggerInstance!.debug(data || {}, msg),
    info: (msg: string, data?: object) => loggerInstance!.info(data || {}, msg),
    warn: (msg: string, data?: object) => loggerInstance!.warn(data || {}, msg),
    error: (msg: string, data?: object) => loggerInstance!.error(data || {}, msg),
  };
}

// Silent logger for Baileys (troppo verboso)
export function createSilentLogger(): pino.Logger {
  return pino({ level: 'silent' });
}
