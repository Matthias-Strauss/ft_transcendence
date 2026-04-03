import { Prisma } from '@prisma/client';

import { getAvatarUrlFromPath } from '../files/avatars.js';
import { isOnline as presenceIsOnline } from './presence.js';
import { prisma } from '../db.js';
import { UserErrors } from '../errors/catalog.js';

type FriendStatusValue = 'friend' | 'requested' | 'none';

export const friendUserSelect = {
  id: true,
  username: true,
  displayname: true,
  avatarPath: true,
} satisfies Prisma.UserSelect;

export const friendshipUserSelect = {
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

export function getOtherFriendUser(friendship: FriendshipWithUsers, currentUserId: string) {
  return friendship.userOneId === currentUserId ? friendship.userTwo : friendship.userOne;
}

export function serializeFriendUser(
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
    isOnline: presenceIsOnline(user.id),
    isFriend: relation.isFriend ?? false,
    friendStatus: relation.friendStatus ?? 'none',
    friendRequestIncoming: relation.friendRequestIncoming ?? false,
    friendRequestSentByMe: relation.friendRequestSentByMe ?? false,
  };
}

export async function findFriendTargetUserByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: friendUserSelect,
  });

  if (!user) {
    throw UserErrors.userNotFound();
  }

  return user;
}

export async function getAcceptedFriendUserIds(viewerId: string, otherUserId: string[]) {
  const uniqueCandidateIds = [...new Set(otherUserId)].filter(
    (candidateId) => candidateId !== viewerId,
  );

  if (uniqueCandidateIds.length === 0) {
    return new Set<string>();
  }

  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [
        {
          userOneId: viewerId,
          userTwoId: {
            in: uniqueCandidateIds,
          },
        },
        {
          userTwoId: viewerId,
          userOneId: {
            in: uniqueCandidateIds,
          },
        },
      ],
    },
    select: {
      userOneId: true,
      userTwoId: true,
    },
  });

  return new Set(
    friendships.map((friendship) =>
      friendship.userOneId === viewerId ? friendship.userTwoId : friendship.userOneId,
    ),
  );
}

export function getFriendshipUserIdsOrdered(userId: string, otherUserId: string) {
  return userId < otherUserId
    ? { userOneId: userId, userTwoId: otherUserId }
    : { userOneId: otherUserId, userTwoId: userId };
}

export async function findFriendship(userId: string, otherUserId: string) {
  const { userOneId, userTwoId } = getFriendshipUserIdsOrdered(userId, otherUserId);

  return prisma.friendship.findUnique({
    where: {
      userOneId_userTwoId: {
        userOneId,
        userTwoId,
      },
    },
    select: {
      id: true,
      userOneId: true,
      userTwoId: true,
      requesterId: true,
      addresseeId: true,
      status: true,
    },
  });
}

export async function getFriendRelation(viewerId: string, otherUserId: string) {
  if (viewerId === otherUserId) {
    return {
      isFriend: false,
      friendStatus: 'none' as FriendStatusValue,
      friendRequestIncoming: false,
      friendRequestSentByMe: false,
    };
  }

  const friendship = await findFriendship(viewerId, otherUserId);

  if (!friendship) {
    return {
      isFriend: false,
      friendStatus: 'none' as FriendStatusValue,
      friendRequestIncoming: false,
      friendRequestSentByMe: false,
    };
  }

  if (friendship.status === 'ACCEPTED') {
    return {
      isFriend: true,
      friendStatus: 'friend' as FriendStatusValue,
      friendRequestIncoming: false,
      friendRequestSentByMe: false,
    };
  }

  return {
    isFriend: false,
    friendStatus: 'requested' as FriendStatusValue,
    friendRequestIncoming: friendship.addresseeId === viewerId,
    friendRequestSentByMe: friendship.requesterId === viewerId,
  };
}

export async function getAllAcceptedFriendUserIds(viewerId: string) {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ userOneId: viewerId }, { userTwoId: viewerId }],
    },
    select: {
      userOneId: true,
      userTwoId: true,
    },
  });

  return new Set(
    friendships.map((friendship) =>
      friendship.userOneId === viewerId ? friendship.userTwoId : friendship.userOneId,
    ),
  );
}
