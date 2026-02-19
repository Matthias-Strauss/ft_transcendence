import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { hashPassword } from '../src/auth/password.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = 'test';
  const passwordHash = await hashPassword('passwort123');
  const mail = 'test@test.com';
  const displayName = 'test user';

  await prisma.user.upsert({
    where: { username },
    update: { password: passwordHash },
    create: { username, password: passwordHash, email: mail, displayname: displayName },
  });

  console.log(`seed.ts: test user seeded: 'test' 'passwort123'`);
}

main()
  .catch((err) => {
    console.error('seed.ts: failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
