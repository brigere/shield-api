import { Service } from 'typedi';
import { PrismaService } from '../../config/prisma';
import { CreateUserDTO } from './dto/create-user-sto';

@Service()
export class UserService {
  constructor(private db: PrismaService) {}

  public async findAll() {
    const data = await this.db.user.findMany({});
    return data;
  }

  public async createUser(userdata: CreateUserDTO) {
    const user = await this.db.user.create({
      data: {
        email: userdata.email,
        password: userdata.password,
      },
    });

    return user;
  }
}
