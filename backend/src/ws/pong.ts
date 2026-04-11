import type { Server as SocketIOServer, Socket } from 'socket.io';

import type { UserSocketRegistry } from './registry.js';
import type { PongHelloPayload, SocketUser } from './types.js';

export function bindPongHandlers(
  io: SocketIOServer,
  socket: Socket,
  user: SocketUser,
  _registry: UserSocketRegistry,
) {
  socket.on('pong:hello', (_payload: PongHelloPayload | undefined) => {
    socket.emit('pong:welcome', {
      username: user.username,
      socketId: socket.id,
    });
  });
}
