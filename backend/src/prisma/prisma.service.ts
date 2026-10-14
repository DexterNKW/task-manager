import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';
import { databaseUrl } from './database-url';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaBetterSqlite3({ url: databaseUrl() }) });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
