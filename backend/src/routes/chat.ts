import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { AuthedRequest, requireAuth } from '../auth/middleware.js';
import { prisma } from '../db.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { AuthErrors, RequestErrors, UserErrors } from '../errors/catalog.js';
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

    const items = [...conversations.entries()]
      .map(([otherId, message]) => {
        const target = message.senderId === viewerId ? message.recipient : message.sender;

        return {
          target: serializeChatUser(target),
          lastMessage: serializeDirectMessage(message, viewerId),
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
      messages: messages
        .reverse()
        .map((message: DirectMessageWithUsers) => serializeDirectMessage(message, viewerId)),
    });
  }),
);
