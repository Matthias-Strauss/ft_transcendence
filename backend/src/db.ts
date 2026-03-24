import { PrismaClient } from '@prisma/client';
// import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { DATABASE_URL } from './config.js';

// const pool = new Pool({ connectionString: DATABASE_URL });
// const adapter = new PrismaPg(pool);

const adapter = new PrismaPg({ connectionString: DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
