import { Service } from 'typedi';
import { PrismaService } from '../../config/prisma';
import { CreateUserDTO } from './dto/create-user-sto';
import { PasswordService } from '../../libs/services/password.service';
import { HttpError } from 'routing-controllers';

@Service()
export class UserService {
  constructor(
    private db: PrismaService,
    private passwordService: PasswordService,
  ) {}

  public async findAll() {
    const data = await this.db.user.findMany({});
    return data;
  }

  public async createUser(userdata: CreateUserDTO) {
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

    return user;
  }
}
