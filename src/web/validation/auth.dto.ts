import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class SignupDto {
  @IsString()
  @IsNotEmpty({ message: 'Enter your name.' })
  @MaxLength(120)
  name: string;

  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(190)
  email: string;

  @IsString()
  @MinLength(8, { message: 'Use a password with at least 8 characters.' })
  @MaxLength(200)
  password: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Enter your email address.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Enter your password.' })
  password: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Enter a valid email address.' })
  email?: string;

  @IsOptional()
  @ValidateIf((_dto, value) => value !== null)
  @IsString()
  @MaxLength(120)
  businessName?: string | null;
}
