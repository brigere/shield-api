import { Body, Controller, Post } from 'routing-controllers';
import { Service } from 'typedi';
import { SignInDTO } from './dto/signin.dto';
import { LoggerService } from '../../libs/services/logger.service';

@Service()
@Controller('/auth')
export class AuthController {
  constructor(private logger: LoggerService) {}

  @Post('/signin')
  public singIn(@Body() { email, password }: SignInDTO) {
    this.logger.info('Login request', { email, password });
    return 'OK';
  }

  @Post('/signout')
  public signOut() {
    return 'not implemented yet';
  }

  @Post('/register')
  public register() {
    return 'not implented yet';
  }
}
