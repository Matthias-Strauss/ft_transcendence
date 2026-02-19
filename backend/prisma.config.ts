import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const database_url = process.env.DATABASE_URL ?? 'postgresql://user:pass@db:5432/db?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: database_url,
  },
});
