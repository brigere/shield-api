import { Service } from 'typedi';
import { LoggerService } from '../../libs/services/logger.service';
import { PrismaService } from '../../config/prisma';
import { RegisterDTO } from './types';
import { PasswordService } from '../../libs/services/password.service';
import { HttpError, UnauthorizedError } from 'routing-controllers';
import { JwtService } from '../../libs/services/jwt.service';
import { RedisService } from '../../config/redis';

@Service()
export class AuthService {
  constructor(
    private logger: LoggerService,
    private db: PrismaService,
    private passwordService: PasswordService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  public async authenticate(email: string, password: string) {
    const user = await this.findByEmail(email);

    if (!user) {
      this.logger.warn('Login failed - use not found', { email });
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValidPassword = await this.passwordService.compare(password, String(user.password));

    if (!isValidPassword) {
      this.logger.warn('Login failed - invalid credentials', { email });
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = this.jwtService.generateTokens({ userId: user.id, email: user.email });

    this.logger.info('user logged in succesfully', user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      ...tokens,
    };
  }

  public async findByEmail(email: string) {
    const user = await this.db.user.findUnique({
      where: {
        email: email,
      },
    });

    return user;
  }

  public async createUser(userdata: RegisterDTO) {
    const { valid, message } = this.passwordService.validateStrength(userdata.password);

    if (!valid) {
      throw new HttpError(400, message);
    }

    const hashedPass = await this.passwordService.hash(userdata.password);

    const user = await this.db.user.create({
      data: {
        email: userdata.email,
        password: hashedPass,
      },
    });

    return { id: user.id, email: user.email };
  }

  public async signOut(accessToken: string): Promise<boolean> {
    const payload = this.jwtService.decodeToken(accessToken);

    if (!payload) {
      return false;
    }

    const expirationInDays = Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS) || 7;
    const expirationInSeconds = expirationInDays * 24 * 60 * 60;

    try {
      await this.redisService.client.set(
        `revoked:${payload.tokenId}`, // Use a prefix to distinguish denylist entries
        'true', // The value can be anything, 'true' is fine
        { EX: expirationInSeconds }, // Set expiration time (TTL)
      );
      this.logger.info('User logged in succesfully', payload);
      return true;
    } catch (e: any) {
      this.logger.error('error while trying to set value to Redis', e);
      return false;
    }
  }
}
