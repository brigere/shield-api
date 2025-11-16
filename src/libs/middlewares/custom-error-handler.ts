import { Middleware, ExpressErrorMiddlewareInterface } from 'routing-controllers';
import { Service } from 'typedi';
import { Response } from 'express';

@Service()
@Middleware({ type: 'after' })
export class CustomErrorHandler implements ExpressErrorMiddlewareInterface {
  error(error: any, request: any, response: Response, next: any) {
    if (error) {
      console.error(error);
      return response.status(error?.httpCode || 500).json({
        message: error?.message,
      });
    } else {
      next();
    }
  }
}
