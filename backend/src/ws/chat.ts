import type { Prisma } from '@prisma/client';
import type { Socket, Server as SocketIOServer } from 'socket.io';

import {
  findChatTargetByUsername,
  getUserBlockRelation,
  serializeDirectMessage,
} from '../utils/chatUtils.js';
import { createDirectMessage } from './chatHelper.js';
import type { UserSocketRegistry } from './registry.js';
import type { ChatMessagePayload, SocketUser } from './types.js';
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

      const senderEvent = serializeDirectMessage(message, user.id);
      const recipientEvent = serializeDirectMessage(message, recipient.id);
      const recipientSockets = registry.getSocketsByUsername(recipient.username);
      const senderSockets = registry.getSocketsByUsername(user.username);

      if (recipientSockets && recipientSockets.size > 0) {
        for (const recipientSocketId of recipientSockets) {
          io.to(recipientSocketId).emit('chat:message', recipientEvent);
        }
      }

      if (senderSockets && senderSockets.size > 0) {
        for (const senderSocketId of senderSockets) {
          io.to(senderSocketId).emit('chat:message', senderEvent);
        }
      } else {
        socket.emit('chat:message', senderEvent);
      }
    } catch (error) {
      console.error('chat:message failed', error);
      emitChatError(socket, 'Unable to send message right now', 'CHAT_MESSAGE_FAILED');
    }
  });
}
