import { Router } from 'express';

import { prisma } from '../db.js';
import { requireAuth, AuthedRequest } from '../auth/middleware.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { AuthErrors, RequestErrors, UserErrors } from '../errors/catalog.js';
import { getAvatarUrlFromPath } from '../files/avatars.js';
import { getPostViewerContext, postAuthorInclude, serializePost } from '../utils/postUtils.js';
import { UsernameSchema } from '../utils/userUtils.js';
import {
  serializeFriendUser,
  getOtherFriendUser,
  friendshipUserSelect,
  findFriendTargetUserByUsername,
  getAcceptedFriendUserIds,
  findFriendship,
  getFriendshipUserIdsOrdered,
} from '../utils/friendUtils.js';
import { FriendErrors } from '../errors/catalog.js';

export const usersRouter = Router();

usersRouter.get(
  '/users/:username',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const parsed = UsernameSchema.safeParse(req.params);
    if (!parsed.success) {
      throw RequestErrors.badRequest(parsed.error.issues);
    }

    const user = await prisma.user.findUnique({
      where: { username: parsed.data.username },
      select: {
        username: true,
        displayname: true,
        avatarPath: true,
      },
    });
    if (!user) {
      throw UserErrors.userNotFound();
    }

    return res.json({
      username: user.username,
      displayname: user.displayname,
      avatarUrl: getAvatarUrlFromPath(user.avatarPath),
    });
  }),
);

usersRouter.get(
  '/users/:username/posts',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const parsed = UsernameSchema.safeParse(req.params);
    if (!parsed.success) {
      throw RequestErrors.badRequest(parsed.error.issues);
    }

    const user = await prisma.user.findUnique({
      where: { username: parsed.data.username },
      select: { id: true },
    });
    if (!user) {
      throw UserErrors.userNotFound();
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

usersRouter.get(
  '/users/:username/friends',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const parsed = UsernameSchema.safeParse(req.params);
    if (!parsed.success) {
      throw RequestErrors.badRequest(parsed.error.issues);
    }

    const user = await findFriendTargetUserByUsername(parsed.data.username);

    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ userOneId: user.id }, { userTwoId: user.id }],
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      select: friendshipUserSelect,
    });

    const friendUsers = friendships.map((friendship) => getOtherFriendUser(friendship, user.id));
    const acceptedFriendIds = await getAcceptedFriendUserIds(
      req.userId,
      friendUsers.map((friendUser) => friendUser.id),
    );

    return res.json({
      items: friendUsers.map((friendUser) =>
        serializeFriendUser(friendUser, {
          isFriend: acceptedFriendIds.has(friendUser.id),
          friendStatus: acceptedFriendIds.has(friendUser.id) ? 'friend' : 'none',
        }),
      ),
      meta: {
        total: friendUsers.length,
        order: 'updatedAt_desc',
      },
    });
  }),
);

usersRouter.post(
  '/users/:username/request',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const parsed = UsernameSchema.safeParse(req.params);
    if (!parsed.success) {
      throw RequestErrors.badRequest(parsed.error.issues);
    }

    const viewerId = req.userId;
    const targetUser = await findFriendTargetUserByUsername(parsed.data.username);

    const pairIds = getFriendshipUserIdsOrdered(viewerId, targetUser.id);
    const existingFriendship = await findFriendship(viewerId, targetUser.id);

    if (existingFriendship?.status === 'ACCEPTED') {
      throw FriendErrors.alreadyFriends();
    }

    if (existingFriendship?.status === 'PENDING') {
      if (existingFriendship.requesterId === viewerId) {
        return res.json({
          ok: true,
          requested: true,
          user: serializeFriendUser(targetUser, {
            friendStatus: 'requested',
            friendRequestIncoming: false,
            friendRequestSentByMe: true,
          }),
        });
      }

      throw FriendErrors.requestAlreadyIncoming();
    }

    await prisma.friendship.create({
      data: {
        userOneId: pairIds.userOneId,
        userTwoId: pairIds.userTwoId,
        requesterId: viewerId,
        addresseeId: targetUser.id,
        status: 'PENDING',
      },
    });

    return res.status(201).json({
      ok: true,
      requested: true,
      user: serializeFriendUser(targetUser, {
        friendStatus: 'requested',
        friendRequestIncoming: false,
        friendRequestSentByMe: true,
      }),
    });
  }),
);
