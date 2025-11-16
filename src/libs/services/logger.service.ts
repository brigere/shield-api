import pino from 'pino';
import { Service } from 'typedi';

@Service()
export class LoggerService {
  private logger: pino.Logger;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: false,
              },
            }
          : undefined,
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  info(message: string, data?: any) {
    this.logger.info(data || {}, message);
  }

  error(message: string, error?: any) {
    if (error instanceof Error) {
      this.logger.error(
        {
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
        },
        message,
      );
    } else {
      this.logger.error(error || {}, message);
    }
  }

  warn(message: string, data?: any) {
    this.logger.warn(data || {}, message);
  }

  debug(message: string, data?: any) {
    this.logger.debug(data || {}, message);
  }

  fatal(message: string, error?: any) {
    this.logger.fatal(error || {}, message);
  }

  child(bindings: pino.Bindings) {
    return this.logger.child(bindings);
  }

  getLogger() {
    return this.logger;
  }
}
