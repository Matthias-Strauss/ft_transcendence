import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { hashPassword } from '../src/auth/password.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type SeededUser = {
  id: string;
  username: string;
  displayname: string;
};

async function seedUser(
  username: string,
  password: string,
  email: string,
  displayName: string,
): Promise<SeededUser> {
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      password: passwordHash,
      email,
      displayname: displayName,
    },
    create: {
      username,
      password: passwordHash,
      email,
      displayname: displayName,
    },
    select: {
      id: true,
      username: true,
      displayname: true,
    },
  });

  console.log(`seed.ts: user seeded: '${username}' '${password}'`);
  return user;
}

async function seedPost(post: {
  id: string;
  authorId: string;
  content: string;
  imageUrl?: string;
  gameTag?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: Date;
}) {
  await prisma.post.upsert({
    where: { id: post.id },
    update: {
      authorId: post.authorId,
      content: post.content,
      imageUrl: post.imageUrl ?? null,
      gameTag: post.gameTag ?? null,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount,
      createdAt: post.createdAt,
    },
    create: {
      id: post.id,
      authorId: post.authorId,
      content: post.content,
      imageUrl: post.imageUrl ?? null,
      gameTag: post.gameTag ?? null,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount,
      createdAt: post.createdAt,
    },
  });

  console.log(`seed.ts: post seeded: '${post.id}' by '${post.authorId}'`);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function main() {
  const testUser = await seedUser('test', 'test42', 'test@test.com', 'test user');
  const seagullUser = await seedUser('seagull', 'seagull42', 'sea@gull.com', 'Mr. Seagull');

  // AI-Notice: post seeding here was partly generated using AI with the mock data from the frontend
  await seedPost({
    id: 'seed-post-1',
    authorId: testUser.id,
    content: 'Just wrapped up a close Hangman round. One wrong guess left and still pulled it off.',
    imageUrl:
      'https://images.unsplash.com/photo-1451195090173-2e0781d7c33e?q=80&w=1470&auto=format&fit=crop',
    gameTag: 'Hangman',
    likeCount: 128,
    commentCount: 22,
    shareCount: 9,
    createdAt: hoursAgo(1),
  });

  await seedPost({
    id: 'seed-post-2',
    authorId: seagullUser.id,
    content:
      'Tic-Tac-Toe reminder: control the center early or you spend the rest of the match reacting.',
    imageUrl:
      'https://images.unsplash.com/photo-1668901382969-8c73e450a1f5?q=80&w=880&auto=format&fit=crop',
    gameTag: 'Tic-Tac-Toe',
    likeCount: 94,
    commentCount: 31,
    shareCount: 6,
    createdAt: hoursAgo(3),
  });

  await seedPost({
    id: 'seed-post-3',
    authorId: testUser.id,
    content:
      'Spent the evening polishing the lobby flow. Tiny UX details really change the feel of a social game app.',
    imageUrl:
      'https://images.unsplash.com/photo-1535222636729-76586bf52493?q=80&w=1470&auto=format&fit=crop',
    likeCount: 542,
    commentCount: 88,
    shareCount: 41,
    createdAt: hoursAgo(6),
  });

  await seedPost({
    id: 'seed-post-4',
    authorId: seagullUser.id,
    content: 'New personal best in Hangman tonight. Guess pacing helped more than speed.',
    gameTag: 'Hangman',
    likeCount: 61,
    commentCount: 7,
    shareCount: 2,
    createdAt: hoursAgo(10),
  });

  await seedPost({
    id: 'seed-post-5',
    authorId: testUser.id,
    content:
      'Would you rather see daily challenges or weekly tournaments first in the social feed?',
    likeCount: 47,
    commentCount: 16,
    shareCount: 4,
    createdAt: hoursAgo(16),
  });

  await seedPost({
    id: 'seed-post-6',
    authorId: seagullUser.id,
    content:
      'Prototype idea: game tags on posts make it much easier to browse strategy clips and match recaps.',
    gameTag: 'Community',
    likeCount: 33,
    commentCount: 5,
    shareCount: 1,
    createdAt: hoursAgo(24),
  });
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
