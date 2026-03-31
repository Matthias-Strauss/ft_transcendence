import { Router } from 'express';
import { z } from 'zod';
import path from 'node:path';
import fs from 'node:fs/promises';

import { AuthedRequest, requireAuth } from '../auth/middleware.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { AuthErrors, CommentErrors, PostErrors, RequestErrors } from '../errors/catalog.js';
import { prisma } from '../db.js';
import {
  serializePost,
  getPostViewerContext,
  postAuthorInclude,
  serializeComment,
  getCommentViewerContext,
  commentContextIncluded,
  checkCommentBelongsToPost,
  checkPostVisibility,
  getVisiblePostAuthorIds,
} from '../utils/postUtils.js';
import {
  postImageUploadHandler,
  getUploadedPostImageFromReq,
  cleanupUploadedPostImage,
} from '../files/postings.js';
import { resolveInFilesDir } from '../files/storage.js';
import { getAcceptedFriendUserIds } from '../utils/friendUtils.js';

export const postsRouter = Router();

postsRouter.get(
  '/posts',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const visibleAuthorIds = await getVisiblePostAuthorIds(req.userId);

    const posts = await prisma.post.findMany({
      where: {
        authorId: {
          in: [...visibleAuthorIds],
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: postAuthorInclude,
    });

    const [{ likedPostIds, sharedPostIds, bookmarkedPostIds }, friendAuthorIds] = await Promise.all(
      [
        getPostViewerContext(
          posts.map((post) => post.id),
          req.userId,
        ),
        getAcceptedFriendUserIds(
          req.userId,
          posts.map((post) => post.authorId),
        ),
      ],
    );

    return res.json({
      items: posts.map((post) =>
        serializePost(post, {
          likedByMe: likedPostIds.has(post.id),
          sharedByMe: sharedPostIds.has(post.id),
          bookmarkedByMe: bookmarkedPostIds.has(post.id),
          authorIsFriend: friendAuthorIds.has(post.authorId),
        }),
      ),
      meta: {
        total: posts.length,
        order: 'createdAt_desc',
        scope: 'personal_feed',
      },
    });
  }),
);

const CreatePostSchema = z
  .object({
    content: z.string().trim().min(1).max(500),
    gameTag: z.preprocess((value) => {
      if (typeof value === 'string' && value.trim().length === 0) {
        return null;
      }
      return value;
    }, z.union([z.string().trim().min(1).max(40), z.null()]).optional()),
  })
  .strict();

postsRouter.post(
  '/posts',
  requireAuth,
  postImageUploadHandler,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const parsed = CreatePostSchema.safeParse(req.body);
    if (!parsed.success) {
      await cleanupUploadedPostImage(req);
      throw RequestErrors.badRequest(parsed.error.issues);
    }

    const uploadedPostImage = getUploadedPostImageFromReq(req);
    const imagePath = uploadedPostImage
      ? path.posix.join('posts', uploadedPostImage.filename)
      : null;

    let post;
    try {
      post = await prisma.post.create({
        data: {
          authorId: req.userId,
          content: parsed.data.content,
          imagePath,
          gameTag: parsed.data.gameTag ?? null,
        },
        include: postAuthorInclude,
      });
    } catch (err) {
      if (uploadedPostImage) {
        await fs.unlink(uploadedPostImage.path).catch(() => undefined);
      }
      throw err;
    }

    return res.status(201).json(
      serializePost(post, {
        likedByMe: false,
        sharedByMe: false,
        bookmarkedByMe: false,
        authorIsFriend: false,
      }),
    );
  }),
);

postsRouter.get(
  '/posts/:id',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    await checkPostVisibility(req.params.id, req.userId);

    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: postAuthorInclude,
    });

    if (!post) {
      throw PostErrors.notFound();
    }

    const [{ likedPostIds, sharedPostIds, bookmarkedPostIds }, friendAuthorIds] = await Promise.all(
      [
        getPostViewerContext([post.id], req.userId),
        getAcceptedFriendUserIds(req.userId, [post.authorId]),
      ],
    );

    return res.json(
      serializePost(post, {
        likedByMe: likedPostIds.has(post.id),
        sharedByMe: sharedPostIds.has(post.id),
        bookmarkedByMe: bookmarkedPostIds?.has(post.id),
        authorIsFriend: friendAuthorIds.has(post.authorId),
      }),
    );
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
        imagePath: true,
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

    if (existingPost.imagePath) {
      const imageAbsPath = resolveInFilesDir(existingPost.imagePath);
      await fs.unlink(imageAbsPath).catch(() => undefined);
    }

    return res.json({
      ok: true,
      deletedPostId: existingPost.id,
    });
  }),
);

// COMMENTS
postsRouter.get(
  '/posts/:id/comments',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    await checkPostVisibility(req.params.id, req.userId);

    const comments = await prisma.comment.findMany({
      where: { postId: req.params.id },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      include: commentContextIncluded,
    });

    const viewerId = req.userId;
    const [{ likedCommentIds }, friendAuthorIds] = await Promise.all([
      getCommentViewerContext(
        comments.map((comment) => comment.id),
        viewerId,
      ),
      getAcceptedFriendUserIds(
        viewerId,
        comments.map((comment) => comment.authorId),
      ),
    ]);

    return res.json({
      items: comments.map((comment) =>
        serializeComment(comment, viewerId, {
          likedByMe: likedCommentIds.has(comment.id),
          authorIsFriend: friendAuthorIds.has(comment.authorId),
        }),
      ),
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
    await checkPostVisibility(req.params.id, viewerId);

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

    return res.status(201).json(
      serializeComment(comment, viewerId, {
        likedByMe: false,
        authorIsFriend: false,
      }),
    );
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

    await checkPostVisibility(postId, viewerId);

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

// BOOKMARK
postsRouter.post(
  '/posts/:id/bookmark',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const viewerId = req.userId;
    const postId = req.params.id;

    await checkPostVisibility(postId, viewerId);

    await prisma.postBookmark.createMany({
      data: {
        postId,
        userId: viewerId,
      },
      skipDuplicates: true,
    });

    return res.json({
      postId,
      bookmarkedByMe: true,
    });
  }),
);

postsRouter.delete(
  '/posts/:id/bookmark',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const viewerId = req.userId;
    const postId = req.params.id;

    await checkPostVisibility(postId, viewerId);

    await prisma.postBookmark.deleteMany({
      where: {
        postId,
        userId: viewerId,
      },
    });

    return res.json({
      postId,
      bookmarkedByMe: false,
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
    const postId = req.params.id;

    await checkPostVisibility(postId, viewerId);

    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.postLike.createMany({
        data: {
          postId,
          userId: viewerId,
        },
        skipDuplicates: true,
      });

      if (created.count > 0) {
        const updatedPost = await tx.post.update({
          where: { id: postId },
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
        where: { id: postId },
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

postsRouter.delete(
  '/posts/:id/like',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const viewerId = req.userId;
    const postId = req.params.id;

    await checkPostVisibility(postId, viewerId);

    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.postLike.deleteMany({
        where: {
          postId,
          userId: viewerId,
        },
      });

      if (deleted.count > 0) {
        const updatedPost = await tx.post.update({
          where: { id: postId },
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

      const unchangedPost = await tx.post.findUnique({
        where: { id: postId },
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
        likedByMe: false,
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

    await checkPostVisibility(req.params.id, viewerId);

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

    await checkPostVisibility(postId, viewerId);
    await checkCommentBelongsToPost(commentId, postId);

    const result = await prisma.$transaction(async (tx) => {
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
          select: { likeCount: true },
        });

        return {
          likedByMe: true,
          likeCount: updatedComment.likeCount,
        };
      }

      const unchangedComment = await tx.comment.findUnique({
        where: { id: commentId },
        select: { likeCount: true },
      });

      if (!unchangedComment) {
        throw CommentErrors.notFound();
      }

      return {
        likedByMe: true,
        likeCount: unchangedComment.likeCount,
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

postsRouter.delete(
  '/posts/:postId/comments/:commentId/like',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const { postId, commentId } = req.params;
    const viewerId = req.userId;

    await checkPostVisibility(postId, viewerId);
    await checkCommentBelongsToPost(commentId, postId);

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
          select: { likeCount: true },
        });

        return {
          likedByMe: false,
          likeCount: updatedComment.likeCount,
        };
      }

      const unchangedComment = await tx.comment.findUnique({
        where: { id: commentId },
        select: { likeCount: true },
      });

      if (!unchangedComment) {
        throw CommentErrors.notFound();
      }

      return {
        likedByMe: false,
        likeCount: unchangedComment.likeCount,
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
