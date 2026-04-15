import fs from 'node:fs/promises';
import { Router } from 'express';
import { AuthedRequest, requireAuth } from '../auth/middleware.js';
import { prisma } from '../db.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { AuthErrors, ChatErrors, FileErrors, RequestErrors } from '../errors/catalog.js';
import {
  ChatMessagesQuerySchema,
  directMessageInclude,
  findChatTargetByUsername,
  getUserBlockRelation,
  markConversationAsRead,
  moveUploadedChatPdf,
  serializeChatUser,
  serializeDirectMessage,
  UploadChatPdfSchema,
  type DirectMessageWithUsers,
} from '../utils/chatUtils.js';
import { UsernameSchema } from '../utils/userUtils.js';
import { buildChatPdfMetadata, buildChatPdfStoragePath, chatPdfUploadHandler, cleanupUploadedChatPdf, ensureChatPdfStorageDir, getUploadedChatPdfFromReq } from '../files/chatPdfs.js';
import { createDirectMessage } from '../ws/chatHelper.js';
import { resolveInFilesDir } from '../files/storage.js';
import { getRealtimeRuntime } from '../ws/runtime.js';
import { emitDirectMessage } from '../ws/chat.js';

export const chatRouter = Router();

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

// pdf upload for conversation
chatRouter.post(
  '/chat/conversations/:username/files/pdf',
  requireAuth,
  chatPdfUploadHandler,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const parsedUsernameSchema = UsernameSchema.safeParse(req.params);
    if (!parsedUsernameSchema.success) {
      await cleanupUploadedChatPdf(req);
      throw RequestErrors.badRequest(parsedUsernameSchema.error.issues);
    }

    const parsedBody = UploadChatPdfSchema.safeParse(req.body);
    if (!parsedBody.success) {
      await cleanupUploadedChatPdf(req);
      throw RequestErrors.badRequest(parsedBody.error.issues);
    }

    const uploadedPdf = getUploadedChatPdfFromReq(req);
    if (!uploadedPdf) {
      throw FileErrors.missingFile();
    }

    const viewerId = req.userId;
    const targetUser = await findChatTargetByUsername(parsedUsernameSchema.data.username);
    const relation = await getUserBlockRelation(viewerId, targetUser.id);

    if (!relation.canMessage) {
      await cleanupUploadedChatPdf(req);
      throw relation.blockedByMe ? ChatErrors.blockedByMe() : ChatErrors.blockedByTarget();
    }

    const messageText = parsedBody.data.text ?? uploadedPdf.originalname;

    let message;
    let storedPdfPath: string | null = null;

    try {
      message = await createDirectMessage({
        senderId: viewerId,
        recipientId: targetUser.id,
        text: messageText,
        type: 'FILE',
      });

      storedPdfPath = buildChatPdfStoragePath(message.id);
      await ensureChatPdfStorageDir();
      await moveUploadedChatPdf({
        sourcePath: uploadedPdf.path,
        targetPath: resolveInFilesDir(storedPdfPath),
      });

      message = await prisma.directMessage.update({
        where: {
          id: message.id,
        },
        data: {
          metadata: buildChatPdfMetadata({
            originalName: uploadedPdf.originalname,
            sizeBytes: uploadedPdf.size,
            storagePath: storedPdfPath,
          }),
        },
        include: directMessageInclude,
      });
    } catch (error) {
      console.error('[chat-pdf-upload] failed', {
        viewerId,
        targetUsername: parsedUsernameSchema.data.username,
        uploadedFilename: uploadedPdf.originalname,
        uploadedMimeType: uploadedPdf.mimetype,
        storedPdfPath,
        messageId: message?.id ?? null,
        error,
      });

      if (storedPdfPath) {
        await fs.unlink(resolveInFilesDir(storedPdfPath)).catch(() => undefined);
      } else {
        await fs.unlink(uploadedPdf.path).catch(() => undefined);
      }

      if (message?.id) {
        await prisma.directMessage.delete({
          where: {
            id: message.id,
          },
        }).catch(() => undefined);
      }

      throw error;
    }

    const realtimeRuntime = getRealtimeRuntime();
    if (realtimeRuntime) {
      try {
        emitDirectMessage(realtimeRuntime.io, realtimeRuntime.registry, message);
      } catch (error) {
        console.error('[chat-pdf-upload] realtime emit failed', {
          messageId: message.id,
          error,
        });
      }
    }

    return res.status(201).json(serializeDirectMessage(message, viewerId));
  }),
);

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
