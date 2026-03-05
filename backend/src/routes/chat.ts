import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { AuthedRequest, requireAuth } from '../auth/middleware.js';
import { prisma } from '../db.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { AuthErrors, ChatErrors, RequestErrors, UserErrors } from '../errors/catalog.js';
import { getAvatarUrlFromPath } from '../files/avatars.js';

export const chatRouter = Router();

const UsernameSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9._-]+$/),
});

const chatUserSelect = {
  id: true,
  username: true,
  displayname: true,
  avatarPath: true,
} satisfies Prisma.UserSelect;

const directMessageInclude = {
  sender: {
    select: chatUserSelect,
  },
  recipient: {
    select: chatUserSelect,
  },
} satisfies Prisma.DirectMessageInclude;

type DirectMessageWithUsers = Prisma.DirectMessageGetPayload<{
  include: typeof directMessageInclude;
}>;

type ChatPartnerUser = Prisma.UserGetPayload<{
  select: typeof chatUserSelect;
}>;

function serializeChatUser(user: ChatPartnerUser) {
  return {
    id: user.id,
    username: user.username,
    displayname: user.displayname,
    avatarUrl: getAvatarUrlFromPath(user.avatarPath),
  };
}

function serializeDirectMessage(message: DirectMessageWithUsers, viewerId: string) {
  return {
    id: message.id,
    text: message.text,
    type: message.type,
    metadata: message.metadata,
    createdAt: message.createdAt,
    readAt: message.readAt,
    isOwn: message.senderId === viewerId,
    sender: serializeChatUser(message.sender),
    recipient: serializeChatUser(message.recipient),
  };
}

// get recent conversations with last message and unread count
chatRouter.get(
  '/chat/conversations',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const viewerId = req.userId;

    const [recentMessages, unreadCounts] = await Promise.all([
      prisma.directMessage.findMany({
        where: {
          OR: [{ senderId: viewerId }, { recipientId: viewerId }],
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 250,
        include: directMessageInclude,
      }),
      prisma.directMessage.groupBy({
        by: ['senderId'],
        where: {
          recipientId: viewerId,
          readAt: null,
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const conversations = new Map<string, (typeof recentMessages)[number]>();

    for (const message of recentMessages) {
      const otherId = message.senderId === viewerId ? message.recipientId : message.senderId;
      if (!conversations.has(otherId)) {
        conversations.set(otherId, message);
      }
    }

    const otherUserIds = [...conversations.keys()];

    const blockEntries =
      otherUserIds.length === 0
        ? []
        : await prisma.userBlock.findMany({
            where: {
              OR: [
                {
                  blockerUserId: viewerId,
                  blockedUserId: {
                    in: otherUserIds,
                  },
                },
                {
                  blockerUserId: {
                    in: otherUserIds,
                  },
                  blockedUserId: viewerId,
                },
              ],
            },
            select: {
              blockerUserId: true,
              blockedUserId: true,
            },
          });

    const blockPairs = new Set(
      blockEntries.map(
        (entry: { blockerUserId: string; blockedUserId: string }) =>
          `${entry.blockerUserId}:${entry.blockedUserId}`,
      ),
    );
    const unreadCountBySender = new Map(
      unreadCounts.map((entry: { senderId: string; _count: { _all: number } }) => [
        entry.senderId,
        entry._count._all,
      ]),
    );

    const items = [...conversations.entries()]
      .map(([otherId, message]) => {
        const target = message.senderId === viewerId ? message.recipient : message.sender;
        const blockedByMe = blockPairs.has(`${viewerId}:${otherId}`);
        const blockedMe = blockPairs.has(`${otherId}:${viewerId}`);

        return {
          target: serializeChatUser(target),
          lastMessage: serializeDirectMessage(message, viewerId),
          unreadCount: unreadCountBySender.get(otherId) ?? 0,
          blockedByMe,
          blockedMe,
          canMessage: !blockedByMe && !blockedMe,
        };
      })
      .sort((a, b) => {
        const aTime = new Date(a.lastMessage.createdAt).getTime();
        const bTime = new Date(b.lastMessage.createdAt).getTime();
        return bTime - aTime;
      });

    return res.json({
      items,
    });
  }),
);

const ChatMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

async function findChatTargetByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
    select: chatUserSelect,
  });

  if (!user) {
    throw UserErrors.userNotFound();
  }

  return user;
}

async function getUserBlockRelation(viewerId: string, otherUserId: string) {
  const [blockedByMe, blockedMe] = await Promise.all([
    prisma.userBlock.findUnique({
      where: {
        blockerUserId_blockedUserId: {
          blockerUserId: viewerId,
          blockedUserId: otherUserId,
        },
      },
      select: {
        blockerUserId: true,
      },
    }),
    prisma.userBlock.findUnique({
      where: {
        blockerUserId_blockedUserId: {
          blockerUserId: otherUserId,
          blockedUserId: viewerId,
        },
      },
      select: {
        blockerUserId: true,
      },
    }),
  ]);

  return {
    blockedByMe: Boolean(blockedByMe),
    blockedMe: Boolean(blockedMe),
    canMessage: !blockedByMe && !blockedMe,
  };
}

// get chat history with specified user
chatRouter.get(
  '/chat/conversations/:username/messages',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const parsedUsernameSchema = UsernameSchema.safeParse(req.params);
    if (!parsedUsernameSchema.success) {
      throw RequestErrors.badRequest(parsedUsernameSchema.error.issues);
    }

    const parsedQuery = ChatMessagesQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      throw RequestErrors.badRequest(parsedQuery.error.issues);
    }

    const viewerId = req.userId;
    const targetUser = await findChatTargetByUsername(parsedUsernameSchema.data.username);
    const relation = await getUserBlockRelation(viewerId, targetUser.id);

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          {
            senderId: viewerId,
            recipientId: targetUser.id,
          },
          {
            senderId: targetUser.id,
            recipientId: viewerId,
          },
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: parsedQuery.data.limit ?? 100,
      include: directMessageInclude,
    });

    return res.json({
      target: serializeChatUser(targetUser),
      relation,
      messages: messages
        .reverse()
        .map((message: DirectMessageWithUsers) => serializeDirectMessage(message, viewerId)),
    });
  }),
);

async function markConversationAsRead(viewerId: string, otherUserId: string) {
  const readAt = new Date();

  const updateResult = await prisma.directMessage.updateMany({
    where: {
      senderId: otherUserId,
      recipientId: viewerId,
      readAt: null,
    },
    data: {
      readAt,
    },
  });

  return {
    ok: updateResult.count > 0,
    count: updateResult.count,
    readAt,
  };
}

// set read status of messages in conversation with specified user to read
chatRouter.post(
  '/chat/conversations/:username/read',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const parsedUsernameSchema = UsernameSchema.safeParse(req.params);
    if (!parsedUsernameSchema.success) {
      throw RequestErrors.badRequest(parsedUsernameSchema.error.issues);
    }

    const viewerId = req.userId;
    const targetUser = await findChatTargetByUsername(parsedUsernameSchema.data.username);
    const result = await markConversationAsRead(viewerId, targetUser.id);

    return res.json({
      ok: result.ok,
      count: result.count,
      readAt: result.readAt,
      username: targetUser.username,
    });
  }),
);

// block a user from chatting
chatRouter.post(
  '/chat/block/:username',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const parsedUsernameSchema = UsernameSchema.safeParse(req.params);
    if (!parsedUsernameSchema.success) {
      throw RequestErrors.badRequest(parsedUsernameSchema.error.issues);
    }

    const viewerId = req.userId;
    const targetUser = await findChatTargetByUsername(parsedUsernameSchema.data.username);

    if (viewerId === targetUser.id) {
      throw ChatErrors.blockToSelfForbidden();
    }

    const blocked = await prisma.userBlock.upsert({
      where: {
        blockerUserId_blockedUserId: {
          blockerUserId: viewerId,
          blockedUserId: targetUser.id,
        },
      },
      update: {},
      create: {
        blockerUserId: viewerId,
        blockedUserId: targetUser.id,
      },
    });

    return res.json({
      ok: blocked ? true : false,
      blocked: true,
      target: serializeChatUser(targetUser),
    });
  }),
);

// unblock a user
chatRouter.delete(
  '/chat/block/:username',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const parsedUsernameSchema = UsernameSchema.safeParse(req.params);
    if (!parsedUsernameSchema.success) {
      throw RequestErrors.badRequest(parsedUsernameSchema.error.issues);
    }

    const viewerId = req.userId;
    const targetUser = await findChatTargetByUsername(parsedUsernameSchema.data.username);

    const unblocked = await prisma.userBlock.deleteMany({
      where: {
        blockerUserId: viewerId,
        blockedUserId: targetUser.id,
      },
    });

    return res.json({
      ok: unblocked.count > 0,
      blocked: false,
      target: serializeChatUser(targetUser),
    });
  }),
);

// list of all blocked users
chatRouter.get(
  '/chat/block',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const blocks = await prisma.userBlock.findMany({
      where: {
        blockerUserId: req.userId,
      },
      orderBy: [{ createdAt: 'desc' }],
      select: {
        createdAt: true,
        blocked: {
          select: {
            id: true,
            username: true,
            displayname: true,
            avatarPath: true,
          },
        },
      },
    });

    return res.json({
      items: blocks.map(
        (entry: { blocked: Parameters<typeof serializeChatUser>[0]; createdAt: Date }) => ({
          ...serializeChatUser(entry.blocked),
          blockedAt: entry.createdAt,
        }),
      ),
      meta: {
        total: blocks.length,
        order: 'createdAt_desc',
      },
    });
  }),
);
