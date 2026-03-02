import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { AuthedRequest, requireAuth } from '../auth/middleware.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { AuthErrors, PostErrors, RequestErrors } from '../errors/catalog.js';
import { prisma } from '../db.js';
import { getAvatarUrlFromPath } from '../files/avatars.js';

export const postsRouter = Router();

const postAuthorInclude = {
  author: {
    select: {
      id: true,
      username: true,
      displayname: true,
      avatarPath: true,
    },
  },
} satisfies Prisma.PostInclude;

type PostWithAuthor = Prisma.PostGetPayload<{
  include: typeof postAuthorInclude;
}>;

function serializePost(post: PostWithAuthor) {
  const { author, ...safePost } = post;
  const { avatarPath, ...safeAuthor } = author;

  return {
    ...safePost,
    author: {
      ...safeAuthor,
      avatarUrl: getAvatarUrlFromPath(avatarPath),
    },
  };
}

postsRouter.get(
  '/posts',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const posts = await prisma.post.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: postAuthorInclude,
    });

    return res.json({
      items: posts.map(serializePost),
      meta: {
        total: posts.length,
        order: 'createdAt_desc',
      },
    });
  }),
);

const CreatePostSchema = z
  .object({
    content: z.string().trim().min(1).max(500),
    imageUrl: z.union([z.url(), z.null()]).optional(),
    gameTag: z.union([z.string().trim().min(1).max(40), z.null()]).optional(),
  })
  .strict();

postsRouter.post(
  '/posts/create',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const parsed = CreatePostSchema.safeParse(req.body);
    if (!parsed.success) {
      throw RequestErrors.badRequest(parsed.error.issues);
    }

    const post = await prisma.post.create({
      data: {
        authorId: req.userId,
        content: parsed.data.content,
        imageUrl: parsed.data.imageUrl ?? null,
        gameTag: parsed.data.gameTag ?? null,
      },
      include: postAuthorInclude,
    });

    return res.status(201).json(serializePost(post));
  }),
);

postsRouter.get(
  '/posts/:id',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: postAuthorInclude,
    });

    if (!post) {
      throw PostErrors.notFound();
    }

    return res.json(serializePost(post));
  }),
);

postsRouter.delete(
  '/posts/:id',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const existingPost = await prisma.post.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!existingPost) {
      throw PostErrors.notFound();
    }

    if (existingPost.authorId !== req.userId) {
      throw PostErrors.deleteForbidden();
    }

    await prisma.post.delete({
      where: { id: existingPost.id },
    });

    return res.json({
      ok: true,
      deletedPostId: existingPost.id,
    });
  }),
);
