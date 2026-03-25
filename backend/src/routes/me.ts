import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { prisma } from '../db.js';
import { requireAuth, AuthedRequest } from '../auth/middleware.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { AuthErrors, RequestErrors, UserErrors } from '../errors/catalog.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { clearRefreshCookie } from '../auth/refresh.js';
import { getAvatarUrlFromPath } from '../files/avatars.js';
import { getPostViewerContext, postAuthorInclude, serializePost } from '../utils/postUtils.js';
import { prismaUniqueToUserError } from '../utils/meUtils.js';

export const meRouter = Router();

type FriendStatusValue = 'friend' | 'requested' | 'none';

meRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        displayname: true,
        email: true,
        avatarPath: true,
      },
    });
    if (!user) {
      throw AuthErrors.invalidToken();
    }

    const { avatarPath, ...safeUser } = user;
    return res.json({
      ...safeUser,
      avatarUrl: getAvatarUrlFromPath(avatarPath),
    });
  }),
);

meRouter.get(
  '/me/posts',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true },
    });
    if (!user) {
      throw AuthErrors.invalidToken();
    }

    const posts = await prisma.post.findMany({
      where: { authorId: user.id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: postAuthorInclude,
    });

    const { likedPostIds, sharedPostIds } = await getPostViewerContext(
      posts.map((post) => post.id),
      req.userId,
    );

    return res.json({
      items: posts.map((post) =>
        serializePost(post, {
          likedByMe: likedPostIds.has(post.id),
          sharedByMe: sharedPostIds.has(post.id),
        }),
      ),
      meta: {
        total: posts.length,
        order: 'createdAt_desc',
      },
    });
  }),
);

meRouter.get(
  '/me/bookmarks',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const bookmarks = await prisma.postBookmark.findMany({
      where: { userId: req.userId },
      orderBy: [{ createdAt: 'desc' }, { postId: 'desc' }],
      include: {
        post: {
          include: postAuthorInclude,
        },
      },
    });

    const posts = bookmarks.map((bookmark) => bookmark.post);
    const { likedPostIds, sharedPostIds } = await getPostViewerContext(
      posts.map((post) => post.id),
      req.userId,
    );

    return res.json({
      items: posts.map((post) =>
        serializePost(post, {
          likedByMe: likedPostIds.has(post.id),
          sharedByMe: sharedPostIds.has(post.id),
          bookmarkedByMe: true,
        }),
      ),
      meta: {
        total: posts.length,
        order: 'bookmarkedAt_desc',
      },
    });
  }),
);

const friendUserSelect = {
  id: true,
  username: true,
  displayname: true,
  avatarPath: true,
} satisfies Prisma.UserSelect;

const friendshipUserSelect = {
  userOneId: true,
  userTwoId: true,
  userOne: {
    select: friendUserSelect,
  },
  userTwo: {
    select: friendUserSelect,
  },
} satisfies Prisma.FriendshipSelect;

type FriendshipWithUsers = Prisma.FriendshipGetPayload<{
  select: typeof friendshipUserSelect;
}>;

type FriendListUser = Prisma.UserGetPayload<{
  select: typeof friendUserSelect;
}>;

function getOtherFriendUser(friendship: FriendshipWithUsers, currentUserId: string) {
  return friendship.userOneId === currentUserId ? friendship.userTwo : friendship.userOne;
}

function serializeFriendUser(
  user: FriendListUser,
  relation: Partial<{
    isFriend: boolean;
    friendStatus: FriendStatusValue;
    friendRequestIncoming: boolean;
    friendRequestSentByMe: boolean;
  }> = {},
) {
  const { avatarPath, ...safeUser } = user;

  return {
    ...safeUser,
    avatarUrl: getAvatarUrlFromPath(avatarPath),
    isFriend: relation.isFriend ?? false,
    friendStatus: relation.friendStatus ?? 'none',
    friendRequestIncoming: relation.friendRequestIncoming ?? false,
    friendRequestSentByMe: relation.friendRequestSentByMe ?? false,
  };
}

meRouter.get(
  '/me/friends',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const viewerId = req.userId;
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ userOneId: viewerId }, { userTwoId: viewerId }],
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      select: friendshipUserSelect,
    });

    const friendUsers = friendships.map((friendship) => getOtherFriendUser(friendship, viewerId));

    return res.json({
      items: friendUsers.map((friendUser) =>
        serializeFriendUser(friendUser, {
          isFriend: true,
          friendStatus: 'friend',
        }),
      ),
      meta: {
        total: friendUsers.length,
        order: 'updatedAt_desc',
      },
    });
  }),
);

const UpdateMeSchema = z
  .object({
    displayname: z
      .string()
      .min(1)
      .max(30)
      .regex(/^[a-zA-Z0-9._-]+( [a-zA-Z0-9._-]+)*$/)
      .optional(),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3)
      .max(30)
      .regex(/^[a-z0-9._-]+$/)
      .optional(),
    email: z.union([z.email(), z.null()]).optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.displayname === undefined && val.username === undefined && val.email === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least one parameter needs to be provided',
        path: [],
      });
    }
  });

meRouter.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const parsed = UpdateMeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw RequestErrors.badRequest(parsed.error.issues);
    }

    const updateData: {
      displayname?: string;
      username?: string;
      email?: string | null;
    } = {};

    if (parsed.data.displayname !== undefined) updateData.displayname = parsed.data.displayname;
    if (parsed.data.username !== undefined) updateData.username = parsed.data.username;
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email;

    try {
      const updated = await prisma.user.update({
        where: { id: req.userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          displayname: true,
          email: true,
          avatarPath: true,
        },
      });

      const { avatarPath, ...safeUser } = updated;
      return res.json({
        ...safeUser,
        avatarUrl: getAvatarUrlFromPath(avatarPath),
      });
    } catch (err) {
      const conflict = prismaUniqueToUserError(err);
      if (conflict) {
        throw conflict;
      }

      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw AuthErrors.invalidToken();
      }

      throw err;
    }
  }),
);

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(100),
    newPassword: z.string().min(3).max(100),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.currentPassword === val.newPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'New password must be different from current password',
        path: ['newPassword'],
      });
    }
  });

meRouter.put(
  '/me/change-password',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const parsed = ChangePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      throw RequestErrors.badRequest(parsed.error.issues);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        password: true,
      },
    });
    if (!user) {
      throw AuthErrors.invalidToken();
    }

    const passwordCorrect = await verifyPassword(parsed.data.currentPassword, user.password);
    if (!passwordCorrect) {
      throw UserErrors.currentPasswordIncorrect();
    }

    const newPasswordHash = await hashPassword(parsed.data.newPassword);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: newPasswordHash },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    clearRefreshCookie(req, res);

    return res.json({ ok: true });
  }),
);
