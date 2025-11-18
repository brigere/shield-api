import { ExpressMiddlewareInterface, Middleware } from 'routing-controllers';
import { Service } from 'typedi';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../services/jwt.service';
import { LoggerService } from '../services/logger.service';
import { RedisService } from '../../config/redis';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
      };
    }
  }
}

@Service()
export class AuthMiddleware implements ExpressMiddlewareInterface {
  constructor(
    private jwtService: JwtService,
    private logger: LoggerService,
    private redis: RedisService,
  ) {}

  async use(request: Request, response: Response, next: NextFunction) {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      this.logger.warn('No authorization header provided');
      return response.status(401).json({
        status: 'error',
        message: 'No authorization token provided',
      });
    }

    // Expected format: "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      this.logger.warn('Invalid authorization header format');
      return response.status(401).json({
        status: 'error',
        message: 'Invalid authorization header format. Expected: Bearer <token>',
      });
    }

    const token = parts[1];

    const payload = this.jwtService.verifyAccessToken(token);

    if (!payload) {
      this.logger.warn('Invalid or expired token');
      return response.status(401).json({
        status: 'error',
        message: 'Invalid or expired token',
      });
    }

    const revoked = await this.redis.client.get(`revoked:${payload.tokenId}`);

    if (revoked) {
      this.logger.warn('Revoked token was provijded');
      return response.status(401).json({
        status: 'error',
        message: 'Invalid or expired token',
      });
    }

    // Attach user info to request
    request.user = {
      userId: payload.userId,
      email: payload.email,
    };

    this.logger.debug('User authenticated', { userId: payload.userId });

    next();
  }
}
