import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { hashPassword } from '../src/auth/password.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedUser(
  username: string,
  password: string,
  email: string,
  displayName: string,
) {
  const passwordHash = await hashPassword(password);

  await prisma.user.upsert({
    where: { username },
    update: { password: passwordHash },
    create: {
      username,
      password: passwordHash,
      email,
      displayname: displayName,
    },
  });

  console.log(`seed.ts: user seeded: '${username}' '${password}'`);
}

async function main() {
  await seedUser('test', 'test42', 'test@test.com', 'test user');
  await seedUser('seagull', 'seagull42', 'sea@gull.com', 'Mr. Seagull');
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
