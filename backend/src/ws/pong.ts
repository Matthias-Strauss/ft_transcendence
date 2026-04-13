import type { Socket } from 'socket.io';

import type { MatchManager } from '../pong_game/game/turnManager.js';
import type { PongInputPayload, SocketUser } from './types.js';

export function bindPongHandlers(
  socket: Socket,
  user: SocketUser,
  matchManager: MatchManager,
) {
  matchManager.reconnect(socket.id, user.username);

  socket.on('pong:join', () => {
    matchManager.join(socket.id, user.username);
  });

  socket.on('pong:input', (payload: PongInputPayload) => {
    if (!payload || typeof payload.left !== 'boolean' || typeof payload.right !== 'boolean') {
      return;
    }
    matchManager.setInput(socket.id, { left: payload.left, right: payload.right });
  });

  socket.on('pong:leave', () => {
    matchManager.leave(socket.id, 'left');
  });

  socket.on('disconnect', () => {
    matchManager.leave(socket.id, 'disconnect');
  });
}
