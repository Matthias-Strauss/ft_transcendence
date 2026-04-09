import type { Socket, Server as SocketIOServer } from 'socket.io';

import { bindChatMessageHandler } from './chat.js';
import type { UserSocketRegistry } from './registry.js';
import type { SocketUser } from './types.js';

export function bindConnectionHandler(io: SocketIOServer, registry: UserSocketRegistry) {
  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser | undefined;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    registry.addConnection(user.username, socket.id);
    console.log('Authenticated user connected:', user);

    bindChatMessageHandler(io, socket, user, registry);
    // continuing match or starting game

    // track user position *(ball position
    socket.on('disconnect', () => {
      registry.removeConnection(socket.id);
      console.log('socket disconnected:', socket.id);
      //handle pausing
    });

    socket.emit('welcome', `Hello ${user.username}`);
  });
}
