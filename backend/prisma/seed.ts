import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = "test";
  const passwordHash = "55789e79eca2f9a1e0786388b869f34f28a64ccbc37eb85ceeb031fd9677e06e"; // passwort123 SHA-256 hex
  const mail = "test@test.com"
  const displayName = "test user";

  await prisma.user.upsert({
    where: { username },
    update: { password: passwordHash },
    create: { username, password: passwordHash, email: mail, displayname: displayName },
  });

  console.log(`seed.ts: test user seeded: 'test' 'passwort123'`);
}

main()
  .catch((err) => {
    console.error("seed.ts: failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
