import { Service } from 'typedi';
import jwt from 'jsonwebtoken';
import { LoggerService } from './logger.service';

export interface TokenPayload {
  userId: number;
  email: string;
  tokenId?: number;
}

export interface DecodedToken {
  userId: number;
  email: string;
  tokenId: number;
  iat: number;
  exp: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresInHour: number;
}

@Service()
export class JwtService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: number;
  private readonly jwtRefreshSecret: string;
  private readonly jwtRefreshExpiresIn: number;

  constructor(private logger: LoggerService) {
    this.jwtSecret = process.env.JWT_SECRET || 'secret';
    this.jwtExpiresIn = Number(process.env.JWT_EXPIRES_IN_HOURS) || 24;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
    this.jwtRefreshExpiresIn = Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS) || 7;

    if (this.jwtSecret === 'secret' || this.jwtRefreshSecret === 'refresh-secret') {
      this.logger.warn(
        'Using default JWT secrets. Please set JWT_SECRET and JWT_REFRESH_SECRET in production!',
      );
    }
  }

  /**
   * Generate access and refresh tokens
   */
  generateTokens(payload: TokenPayload): TokenResponse {
    const tokenId = crypto.randomUUID();
    const accessToken = jwt.sign({ ...payload, tokenId }, this.jwtSecret, {
      expiresIn: this.hoursToSeconds(this.jwtExpiresIn),
    });

    const refreshToken = jwt.sign({ ...payload, tokenId }, this.jwtRefreshSecret, {
      expiresIn: this.daysToSeconds(Number(this.jwtRefreshExpiresIn)),
    });

    this.logger.debug('Tokens generated', { userId: payload.userId });

    return {
      accessToken,
      refreshToken,
      expiresInHour: this.jwtExpiresIn,
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): DecodedToken | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as DecodedToken;
      return decoded;
    } catch (error) {
      this.logger.warn('Access token verification failed', { error: (error as Error).message });
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtRefreshSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      this.logger.warn('Refresh token verification failed', { error: (error as Error).message });
      return null;
    }
  }

  /**
   * Decode token without verification (useful for debugging)
   */
  decodeToken(token: string): DecodedToken | null {
    try {
      return jwt.decode(token) as DecodedToken;
    } catch (error) {
      return null;
    }
  }

  hoursToSeconds(hours: number) {
    return hours * 60 * 60;
  }

  daysToSeconds(days: number) {
    return days * 24 * 60 * 60;
  }
}
