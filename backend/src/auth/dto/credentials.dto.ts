import { Transform } from 'class-transformer';
import { IsByteLength, IsEmail, IsString, MaxLength } from 'class-validator';

export class CredentialsDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;

  // bcrypt only reads the first 72 bytes: longer passwords would be silently
  // truncated, so they are rejected instead.
  @IsString()
  @IsByteLength(8, 72, {
    message: 'password must be between 8 and 72 bytes long',
  })
  password: string;
}
