import { Prisma } from '@prisma/client';
import z from 'zod';
import { prisma } from '../db.js';
import { UserErrors } from '../errors/catalog.js';
import { getAvatarUrlFromPath } from '../files/avatars.js';
import fs from 'node:fs/promises';

export const chatUserSelect = {
  id: true,
  username: true,
  displayname: true,
  avatarPath: true,
} satisfies Prisma.UserSelect;

export const directMessageInclude = {
  sender: {
    select: chatUserSelect,
  },
  recipient: {
    select: chatUserSelect,
  },
} satisfies Prisma.DirectMessageInclude;

export type DirectMessageWithUsers = Prisma.DirectMessageGetPayload<{
  include: typeof directMessageInclude;
}>;

export type ChatPartnerUser = Prisma.UserGetPayload<{
  select: typeof chatUserSelect;
}>;

export function serializeChatUser(user: ChatPartnerUser) {
  return {
    id: user.id,
    username: user.username,
    displayname: user.displayname,
    avatarUrl: getAvatarUrlFromPath(user.avatarPath),
  };
}

export function serializeDirectMessage(message: DirectMessageWithUsers, viewerId: string) {
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

export async function findChatTargetByUsername(username: string) {
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

export const ChatMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export async function getUserBlockRelation(viewerId: string, otherUserId: string) {
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

export async function markConversationAsRead(viewerId: string, otherUserId: string) {
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

export const UploadChatPdfSchema = z
  .object({
    text: z.preprocess((value) => {
      if (typeof value === 'string' && value.trim().length === 0) {
        return null;
      }
      return value;
    }, z.union([z.string().trim().max(500), z.null()]).optional()),
  })
  .strict();

export const DeleteChatFileParamsSchema = z
  .object({
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3)
      .max(30)
      .regex(/^[a-z0-9._-]+$/),
    messageId: z.string().trim().min(1).max(191),
  })
  .strict();

export async function moveUploadedChatPdf(params: { sourcePath: string; targetPath: string }) {
  try {
    await fs.rename(params.sourcePath, params.targetPath);
  } catch (error) {
    const code =
      typeof error === 'object' &&
      error &&
      'code' in error &&
      typeof (error as { code?: unknown }).code === 'string'
        ? (error as { code: string }).code
        : null;

    if (code !== 'EXDEV' && code !== 'EPERM') {
      throw error;
    }

    await fs.copyFile(params.sourcePath, params.targetPath);
    await fs.unlink(params.sourcePath).catch(() => undefined);
  }
}
