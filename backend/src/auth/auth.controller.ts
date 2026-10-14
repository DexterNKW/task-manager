import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PublicUser } from '../users/user.entity';
import { AuthResult, AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { CredentialsDto } from './dto/credentials.dto';
import { Public } from './public.decorator';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('register')
  register(@Body() dto: CredentialsDto): Promise<AuthResult> {
    return this.authService.register(dto);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: CredentialsDto): Promise<AuthResult> {
    return this.authService.login(dto);
  }

  @Get('me')
  me(@CurrentUser() user: PublicUser): PublicUser {
    return user;
  }
}
