import type { Server as SocketIOServer, Socket } from 'socket.io';

import type { UserSocketRegistry } from './registry.js';
import type { ChatMessagePayload, SocketUser } from './types.js';
import { normalizeUsername } from './username.js';

export function bindChatMessageHandler(
  io: SocketIOServer,
  socket: Socket,
  user: SocketUser,
  registry: UserSocketRegistry,
) {
  socket.on('chat:message', (payload: ChatMessagePayload) => {
    const text = payload?.text?.trim();
    if (!text) {
      return;
    }

    const outgoing = { text, from: socket.id, username: user.username };
    const rawTarget = typeof payload.to === 'string' ? payload.to : '';
    const targetKey = rawTarget ? normalizeUsername(rawTarget) : '';

    if (!targetKey) {
      io.emit('chat:message', outgoing);
      return;
    }

    const recipientSockets = registry.getSocketsByUsername(targetKey);
    if (!recipientSockets || recipientSockets.size === 0) {
      socket.emit('chat:error', { message: `User @${payload.to} is offline` });
      return;
    }

    for (const recipientSocketId of recipientSockets) {
      io.to(recipientSocketId).emit('chat:message', outgoing);
    }

    if (!recipientSockets.has(socket.id)) {
      socket.emit('chat:message', outgoing);
    }
  });
}
