import { Service } from 'typedi';
import { LoggerService } from '../../libs/services/logger.service';
import { PrismaService } from '../../config/prisma';
import { RegisterDTO } from './types';
import { PasswordService } from '../../libs/services/password.service';
import { HttpError, UnauthorizedError } from 'routing-controllers';
import { JwtService } from '../../libs/services/jwt.service';

@Service()
export class AuthService {
  constructor(
    private logger: LoggerService,
    private db: PrismaService,
    private passwordService: PasswordService,
    private jwtService: JwtService,
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
}
