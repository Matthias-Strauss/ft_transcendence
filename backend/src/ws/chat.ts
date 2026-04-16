import type { Prisma } from '@prisma/client';
import type { Socket, Server as SocketIOServer } from 'socket.io';
import {
  DirectMessageWithUsers,
  findChatTargetByUsername,
  getUserBlockRelation,
  markConversationAsRead,
  serializeDirectMessage,
} from '../utils/chatUtils.js';
import {
  buildPongInviteMetadata,
  createPendingGameInvite,
  GAME_INVITE_EXPIRY_MS,
} from '../utils/gameInvites.js';
import { createDirectMessage } from './chatHelper.js';
import type { UserSocketRegistry } from './registry.js';
import type {
  ChatMessagePayload,
  ChatReadPayload,
  ChatTypingPayload,
  GameInviteCreatePayload,
  SocketUser,
} from './types.js';
import { normalizeUsername } from './username.js';

function normalizeMetadata(
  metadata: ChatMessagePayload['metadata'],
): Prisma.InputJsonValue | undefined {
  if (metadata === undefined) {
    return undefined;
  }

  if (metadata === null) {
    return undefined;
  }

  return metadata as Prisma.InputJsonValue;
}

function emitChatError(socket: Socket, message: string, code: string) {
  socket.emit('chat:error', { message, code });
}

export function bindChatMessageHandler(
  io: SocketIOServer,
  socket: Socket,
  user: SocketUser,
  registry: UserSocketRegistry,
) {
  socket.on('chat:message', async (payload: ChatMessagePayload) => {
    try {
      const text = payload?.text?.trim();
      const rawTarget = typeof payload?.to === 'string' ? payload.to : '';
      const targetKey = rawTarget ? normalizeUsername(rawTarget) : '';

      if (!text) {
        return;
      }

      if (!targetKey) {
        emitChatError(socket, 'Please choose a user to chat with', 'CHAT_TARGET_REQUIRED');
        return;
      }

      const recipient = await findChatTargetByUsername(targetKey);

      if (recipient.id === user.id) {
        emitChatError(socket, 'You cannot message yourself', 'CHAT_MESSAGE_TO_SELF_FORBIDDEN');
        return;
      }

      const relation = await getUserBlockRelation(user.id, recipient.id);

      if (!relation.canMessage) {
        emitChatError(
          socket,
          relation.blockedByMe
            ? `You blocked @${recipient.username}. Unblock them to send messages again.`
            : `@${recipient.username} has blocked you.`,
          relation.blockedByMe ? 'CHAT_BLOCKED_BY_ME' : 'CHAT_BLOCKED_BY_TARGET',
        );
        return;
      }

      const message = await createDirectMessage({
        senderId: user.id,
        recipientId: recipient.id,
        text,
        type: payload.type,
        metadata: normalizeMetadata(payload.metadata),
      });

      emitDirectMessage(io, registry, message);

      const senderSockets = registry.getSocketsByUsername(user.username);
      if (!senderSockets || senderSockets.size === 0) {
        socket.emit('chat:message', serializeDirectMessage(message, user.id));
      }
    } catch (error) {
      console.error('chat:message failed', error);
      emitChatError(socket, 'Unable to send message right now', 'CHAT_MESSAGE_FAILED');
    }
  });

  socket.on('chat:typing', async (payload: ChatTypingPayload) => {
    try {
      const rawTarget = typeof payload?.to === 'string' ? payload.to : '';
      const targetKey = rawTarget ? normalizeUsername(rawTarget) : '';

      if (!targetKey) {
        return;
      }

      const recipient = await findChatTargetByUsername(targetKey);
      if (recipient.id === user.id) {
        return;
      }
      const relation = await getUserBlockRelation(user.id, recipient.id);

      if (!relation.canMessage) {
        return;
      }

      const recipientSockets = registry.getSocketsByUsername(recipient.username);
      if (!recipientSockets || recipientSockets.size === 0) {
        return;
      }

      for (const recipientSocketId of recipientSockets) {
        io.to(recipientSocketId).emit('chat:typing', {
          username: user.username,
          isTyping: Boolean(payload?.isTyping),
        });
      }
    } catch (error) {
      console.error('chat:typing failed', error);
    }
  });

  socket.on('game:invite:create', async (payload: GameInviteCreatePayload) => {
    try {
      const rawTarget = typeof payload?.to === 'string' ? payload.to : '';
      const targetKey = rawTarget ? normalizeUsername(rawTarget) : '';

      if (!targetKey) {
        emitChatError(socket, 'Please choose a user to invite', 'GAME_INVITE_TARGET_REQUIRED');
        return;
      }

      const recipient = await findChatTargetByUsername(targetKey);

      if (recipient.id === user.id) {
        emitChatError(socket, 'You cannot invite yourself', 'GAME_INVITE_TO_SELF_FORBIDDEN');
        return;
      }

      const relation = await getUserBlockRelation(user.id, recipient.id);

      if (!relation.canMessage) {
        emitChatError(
          socket,
          relation.blockedByMe
            ? `You blocked @${recipient.username}. Unblock them to send invites again.`
            : `@${recipient.username} has blocked you.`,
          relation.blockedByMe ? 'CHAT_BLOCKED_BY_ME' : 'CHAT_BLOCKED_BY_TARGET',
        );
        return;
      }

      const invite = await createPendingGameInvite({
        senderId: user.id,
        recipientId: recipient.id,
        expiresAt: new Date(Date.now() + GAME_INVITE_EXPIRY_MS),
      });

      const message = await createDirectMessage({
        senderId: user.id,
        recipientId: recipient.id,
        text: 'Pong invite',
        type: 'GAME_INVITE',
        metadata: buildPongInviteMetadata(invite),
      });

      emitDirectMessage(io, registry, message);
    } catch (error) {
      console.error('game:invite:create failed', error);
      emitChatError(socket, 'Unable to send pong invite right now', 'GAME_INVITE_CREATE_FAILED');
    }
  });

  socket.on('chat:read', async (payload: ChatReadPayload) => {
    try {
      const rawTarget = typeof payload?.with === 'string' ? payload.with : '';
      const targetKey = rawTarget ? normalizeUsername(rawTarget) : '';

      if (!targetKey) {
        return;
      }

      const targetUser = await findChatTargetByUsername(targetKey);
      const result = await markConversationAsRead(user.id, targetUser.id);

      if (result.count === 0) {
        return;
      }

      const targetSockets = registry.getSocketsByUsername(targetUser.username);
      if (!targetSockets || targetSockets.size === 0) {
        return;
      }

      for (const targetSocketId of targetSockets) {
        io.to(targetSocketId).emit('chat:read', {
          username: user.username,
          readAt: result.readAt,
        });
      }
    } catch (error) {
      console.error('chat:read failed', error);
    }
  });
}

export function emitDirectMessage(
  io: SocketIOServer,
  registry: UserSocketRegistry,
  message: DirectMessageWithUsers,
) {
  const senderEvent = serializeDirectMessage(message, message.senderId);
  const recipientEvent = serializeDirectMessage(message, message.recipientId);
  const senderSockets = registry.getSocketsByUsername(message.sender.username);
  const recipientSockets = registry.getSocketsByUsername(message.recipient.username);

  if (message.senderId === message.recipientId) {
    if (senderSockets && senderSockets.size > 0) {
      for (const senderSocketId of senderSockets) {
        io.to(senderSocketId).emit('chat:message', senderEvent);
      }
    }

    return;
  }

  if (senderSockets && senderSockets.size > 0) {
    for (const senderSocketId of senderSockets) {
      io.to(senderSocketId).emit('chat:message', senderEvent);
    }
  }

  if (recipientSockets && recipientSockets.size > 0) {
    for (const recipientSocketId of recipientSockets) {
      io.to(recipientSocketId).emit('chat:message', recipientEvent);
    }
  }
}
