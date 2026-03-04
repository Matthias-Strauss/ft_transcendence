import { Prisma } from '@prisma/client';

import { prisma } from '../db.js';
import { getAvatarUrlFromPath } from '../files/avatars.js';
import { PostErrors } from '../errors/catalog.js';

export const postAuthorInclude = {
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

type PostViewerContext = {
  likedByMe?: boolean;
  sharedByMe?: boolean;
};

export function serializePost(post: PostWithAuthor, viewerContext: PostViewerContext = {}) {
  const { author, ...safePost } = post;
  const { avatarPath, ...safeAuthor } = author;

  return {
    ...safePost,
    likedByMe: viewerContext.likedByMe ?? false,
    sharedByMe: viewerContext.sharedByMe ?? false,
    author: {
      ...safeAuthor,
      avatarUrl: getAvatarUrlFromPath(avatarPath),
    },
  };
}

export async function getPostViewerContext(postIds: string[], viewerId: string) {
  if (postIds.length === 0) {
    return {
      likedPostIds: new Set<string>(),
      sharedPostIds: new Set<string>(),
    };
  }

  const [likes, shares] = await Promise.all([
    prisma.postLike.findMany({
      where: {
        postId: { in: postIds },
        userId: viewerId,
      },
      select: { postId: true },
    }),
    prisma.postShare.findMany({
      where: {
        postId: { in: postIds },
        userId: viewerId,
      },
      select: { postId: true },
    }),
  ]);

  return {
    likedPostIds: new Set(likes.map((like) => like.postId)),
    sharedPostIds: new Set(shares.map((share) => share.postId)),
  };
}

// COMMENTS
export async function checkPostExists(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) {
    throw PostErrors.notFound();
  }
}

export const commentContextIncluded = {
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

type CommentViewerContext = {
  likedByMe?: boolean;
};

export function serializeComment(
  comment: CommentWithContext,
  viewerId: string,
  viewerContext: CommentViewerContext = {},
) {
  const { author, post, ...safeComment } = comment;
  const { avatarPath, ...safeAuthor } = author;

  return {
    ...safeComment,
    likedByMe: viewerContext.likedByMe,
    author: {
      ...safeAuthor,
      avatarUrl: getAvatarUrlFromPath(avatarPath),
    },
    canDelete: comment.authorId === viewerId || post.authorId === viewerId,
  };
}

export async function getCommentViewerContext(commentIds: string[], viewerId: string) {
  if (commentIds.length === 0) {
    return {
      likedCommentIds: new Set<string>(),
    };
  }

  const likes = await prisma.commentLike.findMany({
    where: {
      userId: viewerId,
      commentId: { in: commentIds },
    },
    select: { commentId: true },
  });

  return {
    likedCommentIds: new Set(likes.map((like) => like.commentId)),
  };
}
