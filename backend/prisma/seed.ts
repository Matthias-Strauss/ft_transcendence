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

  console.log(`seed.ts: user seeded: usr:'${username}' pass:'${password}' uuid:'${user.id}'`);
  return user;
}

async function seedPost(post: {
  id: string;
  authorId: string;
  content: string;
  imageUrl?: string;
  gameTag?: string;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
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

async function seedComment(comment: {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}) {
  await prisma.comment.upsert({
    where: { id: comment.id },
    update: {
      postId: comment.postId,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt,
    },
    create: {
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt,
    },
  });

  console.log(`seed.ts: comment seeded: commentId:'${comment.id}' on postId:'${comment.postId}' by userId:'${comment.authorId}'`);
}

async function seedLike(postId: string, userId: string) {
  await prisma.postLike.upsert({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
    update: {
      postId,
      userId,
    },
    create: {
      postId,
      userId,
    },
  });

  console.log(`seed.ts: like seeded: postId:'${postId}' by userId:'${userId}'`);
}

async function seedShare(postId: string, userId: string) {
  await prisma.postShare.upsert({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
    update: {
      postId,
      userId,
    },
    create: {
      postId,
      userId,
    },
  });

  console.log(`seed.ts: share seeded: postId:'${postId}' by userId:'${userId}'`);
}

async function seedCommentLike(commentId: string, userId: string) {
  await prisma.commentLike.upsert({
    where: {
      commentId_userId: {
        commentId,
        userId,
      },
    },
    update: {
      commentId,
      userId,
    },
    create: {
      commentId,
      userId,
    },
  });

  console.log(`seed.ts: comment like seeded: commentId:'${commentId}' by userId:'${userId}'`);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60 * 1000);
}

async function syncPostCommentLikeShareCounter(postIds: string[]) {
  for (const postId of postIds) {
    const [likeCount, commentCount, shareCount] = await Promise.all([
      prisma.postLike.count({ where: { postId } }),
      prisma.comment.count({ where: { postId } }),
      prisma.postShare.count({ where: { postId } }),
    ]);

    await prisma.post.update({
      where: { id: postId },
      data: {
        likeCount,
        commentCount,
        shareCount,
      },
    });

    console.log(`seed.ts: counters synced for '${postId}'`);
  }
}

async function syncCommentLikeCounter(commentIds: string[]) {
  for (const commentId of commentIds) {
    const likeCount = await prisma.commentLike.count({ where: { commentId } });

    await prisma.comment.update({
      where: { id: commentId },
      data: {
        likeCount,
      },
    });

    console.log(`seed.ts: comment like counter synced for '${commentId}'`);
  }
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
    createdAt: hoursAgo(3),
  });

  await seedPost({
    id: 'seed-post-3',
    authorId: testUser.id,
    content:
      'Spent the evening polishing the lobby flow. Tiny UX details really change the feel of a social game app.',
    imageUrl:
      'https://images.unsplash.com/photo-1535222636729-76586bf52493?q=80&w=1470&auto=format&fit=crop',
    createdAt: hoursAgo(6),
  });

  await seedPost({
    id: 'seed-post-4',
    authorId: seagullUser.id,
    content: 'New personal best in Hangman tonight. Guess pacing helped more than speed.',
    gameTag: 'Hangman',
    createdAt: hoursAgo(10),
  });

  await seedPost({
    id: 'seed-post-5',
    authorId: testUser.id,
    content:
      'Would you rather see daily challenges or weekly tournaments first in the social feed?',
    createdAt: hoursAgo(16),
  });

  await seedPost({
    id: 'seed-post-6',
    authorId: seagullUser.id,
    content:
      'Prototype idea: game tags on posts make it much easier to browse strategy clips and match recaps.',
    gameTag: 'Community',
    createdAt: hoursAgo(24),
  });

  await seedComment({
    id: 'seed-comment-1',
    postId: 'seed-post-1',
    authorId: seagullUser.id,
    content: 'I <3 seagulls!!',
    createdAt: minutesAgo(45),
  });
  await seedComment({
    id: 'seed-comment-2',
    postId: 'seed-post-1',
    authorId: testUser.id,
    content: 'I <3 seagulls too!',
    createdAt: minutesAgo(40),
  });
  await seedComment({
    id: 'seed-comment-3',
    postId: 'seed-post-2',
    authorId: testUser.id,
    content: 'Seagulls are awesome!',
    createdAt: hoursAgo(2),
  });
  await seedComment({
    id: 'seed-comment-4',
    postId: 'seed-post-2',
    authorId: seagullUser.id,
    content: 'I know!',
    createdAt: hoursAgo(1),
  });
  await seedComment({
    id: 'seed-comment-5',
    postId: 'seed-post-3',
    authorId: seagullUser.id,
    content: 'Seagulls are the best!',
    createdAt: hoursAgo(5),
  });
  await seedComment({
    id: 'seed-comment-6',
    postId: 'seed-post-4',
    authorId: testUser.id,
    content: 'Agreed.',
    createdAt: hoursAgo(9),
  });

  await seedLike('seed-post-1', testUser.id);
  await seedLike('seed-post-1', seagullUser.id);
  await seedLike('seed-post-2', testUser.id);
  await seedLike('seed-post-3', seagullUser.id);

  await seedShare('seed-post-1', testUser.id);
  await seedShare('seed-post-1', seagullUser.id);
  await seedShare('seed-post-2', testUser.id);
  await seedShare('seed-post-3', seagullUser.id);

  await seedCommentLike('seed-comment-1', testUser.id);
  await seedCommentLike('seed-comment-1', seagullUser.id);
  await seedCommentLike('seed-comment-2', testUser.id);
  await seedCommentLike('seed-comment-3', seagullUser.id);

  await syncPostCommentLikeShareCounter([
    'seed-post-1',
    'seed-post-2',
    'seed-post-3',
    'seed-post-4',
    'seed-post-5',
    'seed-post-6',
  ]);

  await syncCommentLikeCounter([
    'seed-comment-1',
    'seed-comment-2',
    'seed-comment-3',
    'seed-comment-4',
    'seed-comment-5',
    'seed-comment-6',
  ]);
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
