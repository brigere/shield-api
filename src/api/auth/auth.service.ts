import { Service } from 'typedi';
import { LoggerService } from '../../libs/services/logger.service';
import { PrismaService } from '../../config/prisma';

@Service()
export class AuthService {
  constructor(
    private logger: LoggerService,
    private db: PrismaService,
  ) {}

  public async authenticate(email: string, password: string): Promise<boolean> {
    return false;
  }
}
