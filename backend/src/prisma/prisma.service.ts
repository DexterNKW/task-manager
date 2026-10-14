import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  // The URL comes from ConfigService, not process.env: values read from .env
  // only reach process.env when they are part of the validated config.
  constructor(config: ConfigService) {
    super({
      adapter: new PrismaBetterSqlite3({
        url: config.getOrThrow<string>('DATABASE_URL'),
      }),
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
