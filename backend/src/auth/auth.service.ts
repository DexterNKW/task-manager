import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Prisma } from '../generated/prisma/client';
import { PublicUser } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { CredentialsDto } from './dto/credentials.dto';
import { JwtPayload } from './jwt.strategy';

const PASSWORD_HASH_ROUNDS = 12;

export interface AuthResult {
  accessToken: string;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  // Compared against when the email is unknown, so that a failed login takes
  // the same time whether or not the account exists.
  private readonly dummyHash = bcrypt.hash(
    randomBytes(16).toString('hex'),
    PASSWORD_HASH_ROUNDS,
  );

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register({ email, password }: CredentialsDto): Promise<AuthResult> {
    const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
    try {
      const user = await this.usersService.create(email, passwordHash);
      return await this.issueToken(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  async login({ email, password }: CredentialsDto): Promise<AuthResult> {
    const credentials = await this.usersService.findCredentialsByEmail(email);
    const matches = await bcrypt.compare(
      password,
      credentials?.passwordHash ?? (await this.dummyHash),
    );
    const user =
      credentials && matches
        ? await this.usersService.findById(credentials.id)
        : null;
    if (!user) throw new UnauthorizedException('Invalid email or password');
    return this.issueToken(user);
  }

  private async issueToken(user: PublicUser): Promise<AuthResult> {
    const payload: JwtPayload = { sub: user.id };
    return { accessToken: await this.jwtService.signAsync(payload), user };
  }
}
