import { IsEmail, IsString, Length, MaxLength } from 'class-validator';
import type { ILoginRequest } from '@app/contracts';

export class LoginDto implements ILoginRequest {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @Length(1, 200)
  password: string;
}
