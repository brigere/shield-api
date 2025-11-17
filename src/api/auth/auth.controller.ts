import 'reflect-metadata';
import { Controller, Post, Body, HttpCode, BadRequestError } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { Service } from 'typedi';
import { JwtService } from '../../libs/services/jwt.service';
import { LoggerService } from '../../libs/services/logger.service';
import { AuthService } from './auth.service';
import { AuthResponse, LoginDTO, RegisterDTO } from './types';

@Service()
@Controller('/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private logger: LoggerService,
  ) {}

  @Post('/login')
  @HttpCode(200)
  @OpenAPI({
    summary: 'Login user',
    description: 'Authenticate user and return JWT tokens',
    tags: ['Authentication'],
  })
  @ResponseSchema(AuthResponse)
  async login(@Body() loginData: LoginDTO) {
    this.logger.info('User login attempt', { email: loginData.email });

    return this.authService.authenticate(loginData.email, loginData.password);
  }

  @Post('/register')
  @HttpCode(201)
  @OpenAPI({
    summary: 'Register a new user',
    description: 'Create a new user account and return JWT tokens',
    tags: ['Authentication'],
  })
  @ResponseSchema(AuthResponse)
  async register(@Body() registerData: RegisterDTO) {
    this.logger.info('User registration attempt', { email: registerData.email });

    const existingUser = await this.authService.findByEmail(registerData.email);
    if (existingUser) {
      this.logger.warn('Registration failed - email already exists', { email: registerData.email });
      throw new BadRequestError('Email already exists');
    }

    const user = await this.authService.createUser(registerData);

    const tokens = this.jwtService.generateTokens({
      userId: user.id,
      email: user.email,
    });

    this.logger.info('User registered successfully', { userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      ...tokens,
    };
  }
}
