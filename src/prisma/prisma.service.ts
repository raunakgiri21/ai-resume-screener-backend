import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaLibSql } from '@prisma/adapter-libsql';

import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoToken = process.env.TURSO_AUTH_TOKEN;
    const isProduction = process.env.NODE_ENV === 'production';

    // Use Turso when production credentials are configured.
    if ( isProduction && tursoUrl && tursoToken) {
      console.log('Using Turso database.');
      const adapter = new PrismaLibSql({
        url: tursoUrl,
        authToken: tursoToken,
      });

      super({ adapter });
    } else {
      // Use local SQLite during development.
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required in production.',
        );
      }

      const adapter = new PrismaBetterSqlite3({
        url: process.env.DATABASE_URL!,
      });

      super({ adapter });
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
