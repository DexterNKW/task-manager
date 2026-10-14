import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUser } from './user.entity';

// Selecting fields explicitly keeps the password hash out of every query
// result that can reach a response.
const publicFields = { id: true, email: true, createdAt: true } as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(email: string, passwordHash: string): Promise<PublicUser> {
    return this.prisma.user.create({
      data: { email, passwordHash },
      select: publicFields,
    });
  }

  findById(id: number): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: publicFields,
    });
  }

  findCredentialsByEmail(
    email: string,
  ): Promise<{ id: number; passwordHash: string } | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });
  }
}
