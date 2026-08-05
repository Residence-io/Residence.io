import { IsString, Length, Matches } from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  @Length(1, 254)
  identifier!: string;
}

export class ResetPasswordDto {
  @IsString()
  @Length(32, 512)
  token!: string;

  @IsString()
  @Length(12, 128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'Password must include uppercase, lowercase, and numeric characters.',
  })
  newPassword!: string;
}

export class ChangePasswordDto {
  @IsString()
  @Length(1, 200)
  currentPassword!: string;

  @IsString()
  @Length(12, 128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'Password must include uppercase, lowercase, and numeric characters.',
  })
  newPassword!: string;
}
