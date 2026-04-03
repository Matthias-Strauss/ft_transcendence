import { Prisma } from '@prisma/client';

import { prisma } from '../db.js';
import { getAvatarUrlFromPath } from '../files/avatars.js';
import { getPostImageUrlFromPath } from '../files/postings.js';
import { PostErrors, CommentErrors } from '../errors/catalog.js';
import { getAllAcceptedFriendUserIds, getFriendRelation } from './friendUtils.js';

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
  bookmarkedByMe?: boolean;
  authorIsFriend?: boolean;
};

export function serializePost(post: PostWithAuthor, viewerContext: PostViewerContext = {}) {
  const { author, imagePath: _imagePath, ...safePost } = post;
  const { avatarPath, ...safeAuthor } = author;

  return {
    ...safePost,
    imageUrl: post.imagePath ? getPostImageUrlFromPath(post.imagePath) : _imagePath,
    likedByMe: viewerContext.likedByMe ?? false,
    sharedByMe: viewerContext.sharedByMe ?? false,
    bookmarkedByMe: viewerContext.bookmarkedByMe ?? false,
    author: {
      ...safeAuthor,
      avatarUrl: getAvatarUrlFromPath(avatarPath),
      isFriend: viewerContext.authorIsFriend ?? false,
    },
  };
}

export async function getPostViewerContext(postIds: string[], viewerId: string) {
  if (postIds.length === 0) {
    return {
      likedPostIds: new Set<string>(),
      sharedPostIds: new Set<string>(),
      bookmarkedPostIds: new Set<string>(),
    };
  }

  const [likes, shares, bookmarks] = await Promise.all([
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
    prisma.postBookmark.findMany({
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
    bookmarkedPostIds: new Set(bookmarks.map((bookmark) => bookmark.postId)),
  };
}

export async function checkPostExists(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) {
    throw PostErrors.notFound();
  }
}

export async function checkPostVisibility(postId: string, viewerId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      authorId: true,
      visibility: true,
    },
  });

  if (!post) {
    throw PostErrors.notFound();
  }

  if (post.authorId === viewerId || post.visibility === 'PUBLIC') {
    return post;
  }

  const relation = getFriendRelation(viewerId, post.authorId);

  if (!(await relation).isFriend) {
    throw PostErrors.notFound();
  }

  return post;
}

export async function getVisiblePostAuthorIds(viewerId: string) {
  const acceptedFriendIds = await getAllAcceptedFriendUserIds(viewerId);
  acceptedFriendIds.add(viewerId);

  return acceptedFriendIds;
}

export type PostFeedScope = 'personal_feed' | 'public_feed';

export async function getPostsFeedWthScope(viewerId: string, scope: PostFeedScope) {
  if (scope === 'public_feed') {
    return {
      visibility: 'PUBLIC',
    } satisfies Prisma.PostWhereInput;
  }

  const visibleAuthorIds = await getVisiblePostAuthorIds(viewerId);
  return {
    authorId: {
      in: [...visibleAuthorIds],
    },
  } satisfies Prisma.PostWhereInput;
}

// COMMENTS
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
  authorIsFriend?: boolean;
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
    likedByMe: viewerContext.likedByMe ?? false,
    author: {
      ...safeAuthor,
      avatarUrl: getAvatarUrlFromPath(avatarPath),
      isFriend: viewerContext.authorIsFriend ?? false,
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

export async function checkCommentBelongsToPost(commentId: string, postId: string) {
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
}
