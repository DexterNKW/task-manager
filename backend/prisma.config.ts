import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';
import { databaseUrl } from './src/prisma/database-url';

// The Nest app loads .env through ConfigModule; the Prisma CLI needs the same
// file so that migrations target the database the app will open.
config({ quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl(),
  },
});
