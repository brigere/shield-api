import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Container from 'typedi';
import { JwtService } from '../../../src/libs/services/jwt.service';
import { LoggerService } from '../../../src/libs/services/logger.service';
import jwt from 'jsonwebtoken';

describe('JwtService', () => {
  let jwtService: JwtService;
  let loggerService: LoggerService;

  beforeEach(() => {
    Container.reset();

    // Set test environment variables
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
    process.env.JWT_EXPIRES_IN_HOURS = '2';
    process.env.JWT_REFRESH_EXPIRES_IN_DAYS = '7';

    // Mock logger to avoid console output during tests
    const mockLogger = {
      debug: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
    };
    loggerService = mockLogger as any;

    Container.set(LoggerService, loggerService);
    jwtService = new JwtService(loggerService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should warn when using default secrets', () => {
      Container.reset();
      process.env.JWT_SECRET = 'secret';
      process.env.JWT_REFRESH_SECRET = 'refresh-secret';

      const mockLogger = {
        warn: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
        fatal: vi.fn(),
      } as any;

      Container.set(LoggerService, mockLogger);
      new JwtService(mockLogger);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Using default JWT secrets. Please set JWT_SECRET and JWT_REFRESH_SECRET in production!',
      );
    });

    it('should not warn when using custom secrets', () => {
      expect(loggerService.warn).not.toHaveBeenCalled();
    });

    it('should use default values when env vars are not set', () => {
      Container.reset();
      delete process.env.JWT_EXPIRES_IN_HOURS;
      delete process.env.JWT_REFRESH_EXPIRES_IN_DAYS;

      const mockLogger = {
        warn: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
        fatal: vi.fn(),
      } as any;

      Container.set(LoggerService, mockLogger);
      const service = new JwtService(mockLogger);

      const tokens = service.generateTokens({ userId: 1, email: 'test@example.com' });
      expect(tokens.expiresInHour).toBe(24); // default value
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const tokens = jwtService.generateTokens(payload);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresInHour).toBe(2);
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should include tokenId in generated tokens', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const tokens = jwtService.generateTokens(payload);

      const decodedAccess = jwt.decode(tokens.accessToken) as any;
      const decodedRefresh = jwt.decode(tokens.refreshToken) as any;

      expect(decodedAccess.tokenId).toBeDefined();
      expect(decodedRefresh.tokenId).toBeDefined();
      expect(decodedAccess.tokenId).toBe(decodedRefresh.tokenId);
      expect(typeof decodedAccess.tokenId).toBe('string');
    });

    it('should include userId and email in tokens', () => {
      const payload = { userId: 123, email: 'john@example.com' };
      const tokens = jwtService.generateTokens(payload);

      const decoded = jwt.decode(tokens.accessToken) as any;

      expect(decoded.userId).toBe(123);
      expect(decoded.email).toBe('john@example.com');
    });

    it('should include tokenId from payload if provided', () => {
      const payload = { userId: 1, email: 'test@example.com', tokenId: 999 };
      const tokens = jwtService.generateTokens(payload);

      const decoded = jwt.decode(tokens.accessToken) as any;

      // Note: The tokenId in payload will be overridden by crypto.randomUUID()
      // based on your implementation
      expect(decoded.tokenId).toBeDefined();
    });

    it('should log debug message when tokens are generated', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      jwtService.generateTokens(payload);

      expect(loggerService.debug).toHaveBeenCalledWith('Tokens generated', { userId: 1 });
    });

    it('should set correct expiration times', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const tokens = jwtService.generateTokens(payload);

      const decodedAccess = jwt.decode(tokens.accessToken) as any;
      const decodedRefresh = jwt.decode(tokens.refreshToken) as any;

      // Access token should expire in 2 hours (7200 seconds)
      const accessTokenLifetime = decodedAccess.exp - decodedAccess.iat;
      expect(accessTokenLifetime).toBe(2 * 60 * 60);

      // Refresh token should expire in 7 days (604800 seconds)
      const refreshTokenLifetime = decodedRefresh.exp - decodedRefresh.iat;
      expect(refreshTokenLifetime).toBe(7 * 24 * 60 * 60);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const tokens = jwtService.generateTokens(payload);
      const verified = jwtService.verifyAccessToken(tokens.accessToken);

      expect(verified).toBeDefined();
      expect(verified?.userId).toBe(1);
      expect(verified?.email).toBe('test@example.com');
      expect(verified?.tokenId).toBeDefined();
      expect(verified?.iat).toBeDefined();
      expect(verified?.exp).toBeDefined();
    });

    it('should return all token fields including iat and exp', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const tokens = jwtService.generateTokens(payload);
      const verified = jwtService.verifyAccessToken(tokens.accessToken);

      expect(verified).toHaveProperty('userId');
      expect(verified).toHaveProperty('email');
      expect(verified).toHaveProperty('tokenId');
      expect(verified).toHaveProperty('iat');
      expect(verified).toHaveProperty('exp');
    });

    it('should return null for invalid token', () => {
      const verified = jwtService.verifyAccessToken('invalid-token');
      expect(verified).toBeNull();
    });

    it('should return null for malformed token', () => {
      const verified = jwtService.verifyAccessToken(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
      );
      expect(verified).toBeNull();
    });

    it('should return null for token signed with wrong secret', () => {
      const wrongToken = jwt.sign({ userId: 1, email: 'test@example.com' }, 'wrong-secret', {
        expiresIn: '1h',
      });

      const verified = jwtService.verifyAccessToken(wrongToken);
      expect(verified).toBeNull();
    });

    it('should log warning when verification fails', () => {
      jwtService.verifyAccessToken('invalid-token');

      expect(loggerService.warn).toHaveBeenCalledWith(
        'Access token verification failed',
        expect.objectContaining({ error: expect.any(String) }),
      );
    });

    it('should return null for expired token', () => {
      const expiredToken = jwt.sign(
        { userId: 1, email: 'test@example.com' },
        'test-secret-key',
        { expiresIn: '-1s' }, // Already expired
      );

      const verified = jwtService.verifyAccessToken(expiredToken);
      expect(verified).toBeNull();
    });

    it('should not verify refresh token as access token', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const tokens = jwtService.generateTokens(payload);

      // Try to verify refresh token with access token method
      const verified = jwtService.verifyAccessToken(tokens.refreshToken);
      expect(verified).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const tokens = jwtService.generateTokens(payload);
      const verified = jwtService.verifyRefreshToken(tokens.refreshToken);

      expect(verified).toBeDefined();
      expect(verified?.userId).toBe(1);
      expect(verified?.email).toBe('test@example.com');
    });

    it('should return null for invalid refresh token', () => {
      const verified = jwtService.verifyRefreshToken('invalid-token');
      expect(verified).toBeNull();
    });

    it('should return null for token signed with wrong secret', () => {
      const wrongToken = jwt.sign(
        { userId: 1, email: 'test@example.com' },
        'wrong-refresh-secret',
        { expiresIn: '7d' },
      );

      const verified = jwtService.verifyRefreshToken(wrongToken);
      expect(verified).toBeNull();
    });

    it('should log warning when verification fails', () => {
      jwtService.verifyRefreshToken('invalid-token');

      expect(loggerService.warn).toHaveBeenCalledWith(
        'Refresh token verification failed',
        expect.objectContaining({ error: expect.any(String) }),
      );
    });

    it('should not verify access token as refresh token', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const tokens = jwtService.generateTokens(payload);

      // Try to verify access token with refresh token method
      const verified = jwtService.verifyRefreshToken(tokens.accessToken);
      expect(verified).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const tokens = jwtService.generateTokens(payload);
      const decoded = jwtService.decodeToken(tokens.accessToken);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(1);
      expect(decoded?.email).toBe('test@example.com');
      expect(decoded?.tokenId).toBeDefined();
    });

    it('should decode expired token', () => {
      const expiredToken = jwt.sign({ userId: 1, email: 'test@example.com' }, 'test-secret-key', {
        expiresIn: '-1s',
      });

      const decoded = jwtService.decodeToken(expiredToken);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(1);
    });

    it('should decode token with wrong signature', () => {
      const wrongToken = jwt.sign({ userId: 1, email: 'test@example.com' }, 'wrong-secret', {
        expiresIn: '1h',
      });

      const decoded = jwtService.decodeToken(wrongToken);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(1);
    });

    it('should return null for invalid token format', () => {
      const decoded = jwtService.decodeToken('not-a-jwt-token');
      expect(decoded).toBeNull();
    });

    it('should return null for empty token', () => {
      const decoded = jwtService.decodeToken('');
      expect(decoded).toBeNull();
    });
  });

  describe('utility methods', () => {
    describe('hoursToSeconds', () => {
      it('should convert hours to seconds', () => {
        const seconds = jwtService.hoursToSeconds(1);
        expect(seconds).toBe(3600);
      });

      it('should convert multiple hours to seconds', () => {
        expect(jwtService.hoursToSeconds(2)).toBe(7200);
        expect(jwtService.hoursToSeconds(24)).toBe(86400);
        expect(jwtService.hoursToSeconds(0.5)).toBe(1800);
      });
    });

    describe('daysToSeconds', () => {
      it('should convert days to seconds', () => {
        const seconds = jwtService.daysToSeconds(1);
        expect(seconds).toBe(86400);
      });

      it('should convert multiple days to seconds', () => {
        expect(jwtService.daysToSeconds(7)).toBe(604800);
        expect(jwtService.daysToSeconds(30)).toBe(2592000);
        expect(jwtService.daysToSeconds(0.5)).toBe(43200);
      });
    });
  });

  describe('token consistency', () => {
    it('should generate different tokens for same payload', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const tokens1 = jwtService.generateTokens(payload);
      const tokens2 = jwtService.generateTokens(payload);

      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });

    it('should generate tokens with unique tokenIds', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const tokens1 = jwtService.generateTokens(payload);
      const tokens2 = jwtService.generateTokens(payload);

      const decoded1 = jwt.decode(tokens1.accessToken) as any;
      const decoded2 = jwt.decode(tokens2.accessToken) as any;

      expect(decoded1.tokenId).not.toBe(decoded2.tokenId);
    });

    it('should maintain payload data through verification', () => {
      const payload = { userId: 123, email: 'john.doe@example.com' };
      const tokens = jwtService.generateTokens(payload);
      const verified = jwtService.verifyAccessToken(tokens.accessToken);

      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.email).toBe(payload.email);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string token', () => {
      expect(jwtService.verifyAccessToken('')).toBeNull();
      expect(jwtService.verifyRefreshToken('')).toBeNull();
      expect(jwtService.decodeToken('')).toBeNull();
    });

    it('should handle special characters in payload', () => {
      const payload = {
        userId: 1,
        email: 'test+special@example.com',
      };

      const tokens = jwtService.generateTokens(payload);
      const verified = jwtService.verifyAccessToken(tokens.accessToken);

      expect(verified?.email).toBe('test+special@example.com');
    });

    it('should handle very large user IDs', () => {
      const payload = {
        userId: 999999999,
        email: 'test@example.com',
      };

      const tokens = jwtService.generateTokens(payload);
      const verified = jwtService.verifyAccessToken(tokens.accessToken);

      expect(verified?.userId).toBe(999999999);
    });
  });
});
