import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

// DTOs
export class RegisterDTO {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  password: string;
}

export class LoginDTO {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  password: string;
}

export class RefreshTokenDTO {
  @IsString()
  refreshToken: string;
}

export class AuthResponse {
  user: {
    id: number;
    email: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export class UserProfileResponse {
  id: number;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
