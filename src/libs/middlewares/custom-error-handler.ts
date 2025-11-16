import { Middleware, ExpressErrorMiddlewareInterface } from 'routing-controllers';
import { Service } from 'typedi';
import { ValidationError } from 'class-validator';
import { Response } from 'express';
import { LoggerService } from '../services/logger.service';

@Service()
@Middleware({ type: 'after' })
export class CustomErrorHandler implements ExpressErrorMiddlewareInterface {
  constructor(private logger: LoggerService) {}

  error(error: any, request: any, response: Response, next: (err: any) => any) {
    // Check if response has already been sent
    if (response.headersSent) {
      return next(error);
    }

    // Log the error
    this.logger.error('Error occurred', {
      error: error.message,
      stack: error.stack,
      httpCode: error.httpCode,
      url: request.url,
      method: request.method,
    });

    // Handle validation errors
    if (error.errors && Array.isArray(error.errors)) {
      const validationErrors = error.errors as ValidationError[];

      const formattedErrors = validationErrors.map((err) => ({
        property: err.property,
        value: err.value,
        constraints: err.constraints,
        messages: Object.values(err.constraints || {}),
      }));

      this.logger.warn('Validation failed', { errors: formattedErrors });

      return response.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    // Handle other errors
    return response.status(error.httpCode || 500).json({
      status: 'error',
      message: error.message || 'An error occurred',
    });
  }
}
