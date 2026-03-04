import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { AuthedRequest, requireAuth } from '../auth/middleware.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { AuthErrors, CommentErrors, PostErrors, RequestErrors } from '../errors/catalog.js';
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

// COMMENTS
async function checkPostExists(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) {
    throw PostErrors.notFound();
  }
}

const commentContextIncluded = {
  author: {
    select: {
      id: true,
      username: true,
      displayname: true,
      avatarPath: true,
    },
  },
  post: {
    select: {
      id: true,
      authorId: true,
    },
  },
} satisfies Prisma.CommentInclude;

type CommentWithContext = Prisma.CommentGetPayload<{
  include: typeof commentContextIncluded;
}>;

function serializeComment(comment: CommentWithContext, viewerId: string) {
  const { author, post, ...safeComment } = comment;
  const { avatarPath, ...safeAuthor } = author;

  return {
    ...safeComment,
    author: {
      ...safeAuthor,
      avatarUrl: getAvatarUrlFromPath(avatarPath),
    },
    canDelete: comment.authorId === viewerId || post.authorId === viewerId,
  };
}

postsRouter.get(
  '/posts/:id/comments',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    await checkPostExists(req.params.id);

    const comments = await prisma.comment.findMany({
      where: { postId: req.params.id },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      include: commentContextIncluded,
    });

    const viewerId = req.userId;
    return res.json({
      items: comments.map((comment) => serializeComment(comment, viewerId)),
      meta: {
        total: comments.length,
        order: 'createdAt_asc',
      },
    });
  }),
);

const CreateCommentSchema = z
  .object({
    content: z.string().trim().min(1).max(300),
  })
  .strict();

postsRouter.post(
  '/posts/:id/comments',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const parsed = CreateCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw RequestErrors.badRequest(parsed.error.issues);
    }

    const viewerId = req.userId;
    const comment = await prisma.$transaction(async (tx) => {
      const post = await tx.post.findUnique({
        where: { id: req.params.id },
        select: { id: true },
      });

      if (!post) {
        throw PostErrors.notFound();
      }

      const createdComment = await tx.comment.create({
        data: {
          postId: req.params.id,
          authorId: viewerId,
          content: parsed.data.content,
        },
        include: commentContextIncluded,
      });

      await tx.post.update({
        where: { id: req.params.id },
        data: {
          commentCount: { increment: 1 },
        },
      });

      return createdComment;
    });

    return res.status(201).json(serializeComment(comment, viewerId));
  }),
);

postsRouter.delete(
  '/posts/:postId/comments/:commentId',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const { postId, commentId } = req.params;
    const viewerId = req.userId;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          select: { authorId: true },
        },
      },
    });

    if (!comment || comment.postId !== postId) {
      throw CommentErrors.notFound();
    }

    if (comment.authorId !== viewerId && comment.post.authorId !== viewerId) {
      throw CommentErrors.deleteForbidden();
    }

    await prisma.$transaction(async (tx) => {
      await tx.comment.delete({
        where: { id: commentId },
      });

      await tx.post.update({
        where: { id: postId },
        data: {
          commentCount: { decrement: 1 },
        },
      });
    });

    return res.json({
      ok: true,
      deletedCommentId: commentId,
      postId: postId,
    });
  }),
);

// LIKES / SHARES
postsRouter.post(
  '/posts/:id/like',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }
    const viewerId = req.userId;

    const result = await prisma.$transaction(async (tx) => {
      const post = await tx.post.findUnique({
        where: { id: req.params.id },
        select: { id: true, likeCount: true },
      });

      if (!post) {
        throw PostErrors.notFound();
      }

      const deleted = await tx.postLike.deleteMany({
        where: {
          postId: req.params.id,
          userId: viewerId,
        },
      });

      if (deleted.count > 0) {
        const updatedPost = await tx.post.update({
          where: { id: req.params.id },
          data: {
            likeCount: { decrement: 1 },
          },
          select: {
            id: true,
            likeCount: true,
          },
        });

        return {
          postId: updatedPost.id,
          likedByMe: false,
          likeCount: updatedPost.likeCount,
        };
      }

      const created = await tx.postLike.createMany({
        data: {
          postId: req.params.id,
          userId: viewerId,
        },
        skipDuplicates: true,
      });

      if (created.count > 0) {
        const updatedPost = await tx.post.update({
          where: { id: req.params.id },
          data: {
            likeCount: { increment: 1 },
          },
          select: {
            id: true,
            likeCount: true,
          },
        });

        return {
          postId: updatedPost.id,
          likedByMe: true,
          likeCount: updatedPost.likeCount,
        };
      }

      const unchangedPost = await tx.post.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          likeCount: true,
        },
      });

      if (!unchangedPost) {
        throw PostErrors.notFound();
      }

      return {
        postId: unchangedPost.id,
        likedByMe: true,
        likeCount: unchangedPost.likeCount,
      };
    });

    return res.json(result);
  }),
);

postsRouter.post(
  '/posts/:id/share',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }
    const viewerId = req.userId;

    const result = await prisma.$transaction(async (tx) => {
      const post = await tx.post.findUnique({
        where: { id: req.params.id },
        select: { id: true, shareCount: true },
      });

      if (!post) {
        throw PostErrors.notFound();
      }

      const created = await tx.postShare.createMany({
        data: {
          postId: req.params.id,
          userId: viewerId,
        },
        skipDuplicates: true,
      });

      if (created.count > 0) {
        const updatedPost = await tx.post.update({
          where: { id: req.params.id },
          data: {
            shareCount: { increment: 1 },
          },
          select: {
            id: true,
            shareCount: true,
          },
        });

        return {
          postId: updatedPost.id,
          sharedByMe: true,
          shareCount: updatedPost.shareCount,
          incremented: true,
        };
      }

      const unchangedPost = await tx.post.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          shareCount: true,
        },
      });

      if (!unchangedPost) {
        throw PostErrors.notFound();
      }

      return {
        postId: unchangedPost.id,
        sharedByMe: true,
        shareCount: unchangedPost.shareCount,
        incremented: false,
      };
    });

    return res.json(result);
  }),
);

postsRouter.post(
  '/posts/:postId/comments/:commentId/like',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const { postId, commentId } = req.params;
    const viewerId = req.userId;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        postId: true,
      },
    });

    if (!comment || comment.postId !== postId) {
      throw CommentErrors.notFound();
    }

    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.commentLike.deleteMany({
        where: {
          commentId,
          userId: viewerId,
        },
      });

      if (deleted.count > 0) {
        const updatedComment = await tx.comment.update({
          where: { id: commentId },
          data: {
            likeCount: { decrement: 1 },
          },
          select: {
            id: true,
            likeCount: true,
          },
        });

        return {
          likedByMe: false,
          likeCount: updatedComment.likeCount,
        };
      }

      const created = await tx.commentLike.createMany({
        data: {
          commentId,
          userId: viewerId,
        },
        skipDuplicates: true,
      });

      if (created.count > 0) {
        const updatedComment = await tx.comment.update({
          where: { id: commentId },
          data: {
            likeCount: { increment: 1 },
          },
          select: {
            id: true,
            likeCount: true,
          },
        });

        return {
          likedByMe: true,
          likeCount: updatedComment.likeCount,
        };
      }

      const unchanged = await tx.comment.findUnique({
        where: { id: commentId },
        select: { likeCount: true },
      });

      return {
        likedByMe: true,
        likeCount: unchanged!.likeCount,
      };
    });

    return res.json({
      postId,
      commentId,
      likedByMe: result.likedByMe,
      likeCount: result.likeCount,
    });
  }),
);
