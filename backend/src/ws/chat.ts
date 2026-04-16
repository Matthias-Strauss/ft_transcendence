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
  acceptGameInvite,
  buildPongNotificationMetadata,
  buildPongInviteMetadata,
  createPendingGameInvite,
  declineGameInvite,
  expireGameInvite,
  findGameInviteById,
  GAME_INVITE_EXPIRY_MS,
  isGameInviteExpired,
} from '../utils/gameInvites.js';
import { createDirectMessage } from './chatHelper.js';
import type { UserSocketRegistry } from './registry.js';
import type {
  ChatMessagePayload,
  ChatReadPayload,
  ChatTypingPayload,
  GameInviteCreatePayload,
  GameInviteRespondPayload,
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

async function resolvePendingInviteForRecipient(inviteId: string, recipientId: string) {
  const invite = await findGameInviteById(inviteId);

  if (!invite) {
    return { invite: null, error: { message: 'Invite not found', code: 'GAME_INVITE_NOT_FOUND' } };
  }

  if (invite.recipientId !== recipientId) {
    return {
      invite: null,
      error: { message: 'You cannot respond to this invite', code: 'GAME_INVITE_RESPONSE_FORBIDDEN' },
    };
  }

  if (invite.status !== 'PENDING') {
    return {
      invite: null,
      error: { message: 'This invite is no longer pending', code: 'GAME_INVITE_NOT_PENDING' },
    };
  }

  if (isGameInviteExpired(invite)) {
    await expireGameInvite(invite.id);
    return {
      invite: null,
      error: { message: 'This invite has expired', code: 'GAME_INVITE_EXPIRED' },
    };
  }

  return { invite, error: null };
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

  socket.on('game:invite:accept', async (payload: GameInviteRespondPayload) => {
    try {
      const inviteId = typeof payload?.inviteId === 'string' ? payload.inviteId : '';

      if (!inviteId) {
        emitChatError(socket, 'Invite id is required', 'GAME_INVITE_ID_REQUIRED');
        return;
      }

      const result = await resolvePendingInviteForRecipient(inviteId, user.id);
      if (result.error || !result.invite) {
        emitChatError(socket, result.error?.message ?? 'Unable to accept invite', result.error?.code ?? 'GAME_INVITE_ACCEPT_FAILED');
        return;
      }

      const relation = await getUserBlockRelation(user.id, result.invite.senderId);
      if (!relation.canMessage) {
        emitChatError(
          socket,
          relation.blockedByMe ? 'You blocked this user' : 'This user has blocked you',
          relation.blockedByMe ? 'CHAT_BLOCKED_BY_ME' : 'CHAT_BLOCKED_BY_TARGET',
        );
        return;
      }

      const invite = await acceptGameInvite(result.invite.id);
      const message = await createDirectMessage({
        senderId: user.id,
        recipientId: invite.senderId,
        text: 'Pong invite accepted',
        type: 'GAME_NOTIFICATION',
        metadata: buildPongNotificationMetadata(invite, 'invite_accepted'),
      });

      emitDirectMessage(io, registry, message);
    } catch (error) {
      console.error('game:invite:accept failed', error);
      emitChatError(socket, 'Unable to accept pong invite right now', 'GAME_INVITE_ACCEPT_FAILED');
    }
  });

  socket.on('game:invite:decline', async (payload: GameInviteRespondPayload) => {
    try {
      const inviteId = typeof payload?.inviteId === 'string' ? payload.inviteId : '';

      if (!inviteId) {
        emitChatError(socket, 'Invite id is required', 'GAME_INVITE_ID_REQUIRED');
        return;
      }

      const result = await resolvePendingInviteForRecipient(inviteId, user.id);
      if (result.error || !result.invite) {
        emitChatError(socket, result.error?.message ?? 'Unable to decline invite', result.error?.code ?? 'GAME_INVITE_DECLINE_FAILED');
        return;
      }

      const relation = await getUserBlockRelation(user.id, result.invite.senderId);
      if (!relation.canMessage) {
        emitChatError(
          socket,
          relation.blockedByMe ? 'You blocked this user' : 'This user has blocked you',
          relation.blockedByMe ? 'CHAT_BLOCKED_BY_ME' : 'CHAT_BLOCKED_BY_TARGET',
        );
        return;
      }

      const invite = await declineGameInvite(result.invite.id);
      const message = await createDirectMessage({
        senderId: user.id,
        recipientId: invite.senderId,
        text: 'Pong invite declined',
        type: 'GAME_NOTIFICATION',
        metadata: buildPongNotificationMetadata(invite, 'invite_declined'),
      });

      emitDirectMessage(io, registry, message);
    } catch (error) {
      console.error('game:invite:decline failed', error);
      emitChatError(socket, 'Unable to decline pong invite right now', 'GAME_INVITE_DECLINE_FAILED');
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
