import { Middleware, ExpressMiddlewareInterface } from 'routing-controllers';
import { Service } from 'typedi';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../services/logger.service';
import { MIDDLEWARE_PRIORITY } from './priority';

@Service()
@Middleware({ type: 'before', priority: MIDDLEWARE_PRIORITY.logger })
export class HttpLoggerMiddleware implements ExpressMiddlewareInterface {
  constructor(private logger: LoggerService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl, ip } = request;

    // Log request
    this.logger.info('Incoming request', {
      method,
      url: originalUrl,
      ip: ip || request.socket.remoteAddress,
      userAgent: request.get('user-agent'),
    });

    // Capture response
    const originalSend = response.send;
    response.send = function (data: any) {
      const duration = Date.now() - startTime;

      response.send = originalSend;

      const logger = (request as any).logger || new LoggerService();

      logger.info('Request completed', {
        method,
        url: originalUrl,
        statusCode: response.statusCode,
        duration: `${duration}ms`,
      });

      return originalSend.call(this, data);
    };

    next();
  }
}
