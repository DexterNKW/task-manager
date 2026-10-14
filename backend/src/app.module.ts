import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // Enforced only where ThrottlerGuard is applied (the auth endpoints).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
    PrismaModule,
    AuthModule,
    TasksModule,
  ],
})
export class AppModule {}
