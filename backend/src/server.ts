import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { Socket } from 'socket.io';

import { APP_ORIGIN, PORT, CORS_ALLOWED_ORIGINS, FRONTEND_ORIGIN } from './config.js';
import { createApp } from './app.js';
import { initFileStorage } from './files/storage.js';
import { verifyAccessToken } from './auth/jwt.js';

type SocketUser = {
  id: string;
  username: string;
};

type ChatMessagePayload = {
  text: string;
  to?: string;
};

function normalizeUsername(username: string): string {
  return username.trim().replace(/^@/, '').toLowerCase();
}

export function startServer() {
  initFileStorage();
  const app = createApp();
  const httpServer = createServer(app);

  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: [APP_ORIGIN, FRONTEND_ORIGIN],
      credentials: true,
    },
  });

  const usernameToSocketIds = new Map<string, Set<string>>();
  const socketIdToUsername = new Map<string, string>();

  io.use(async (socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('No token provided'));
    }

    try {
      const { payload } = await verifyAccessToken(token);

      if (typeof payload.sub !== 'string' || typeof payload.username !== 'string') {
        return next(new Error('Unauthorized'));
      }

      const user: SocketUser = {
        id: payload.sub,
        username: payload.username,
      };

      socket.data.user = user;
      next();
    } catch {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser | undefined;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    const usernameKey = normalizeUsername(user.username);
    const existing = usernameToSocketIds.get(usernameKey) ?? new Set<string>();
    existing.add(socket.id);
    usernameToSocketIds.set(usernameKey, existing);
    socketIdToUsername.set(socket.id, usernameKey);

    console.log('Authenticated user connected:', user);

    socket.on('chat:message', (payload: ChatMessagePayload) => {
      const text = payload?.text?.trim();
      if (!text) return;

      const outgoing = { text, from: socket.id, username: user.username };
      const rawTarget = typeof payload.to === 'string' ? payload.to : '';
      const targetKey = rawTarget ? normalizeUsername(rawTarget) : '';

      if (targetKey) {
        const recipientSockets = usernameToSocketIds.get(targetKey);

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
        return;
      }

      io.emit('chat:message', outgoing);
    });

    socket.on('disconnect', () => {
      const connectedUsernameKey = socketIdToUsername.get(socket.id);
      if (connectedUsernameKey) {
        const set = usernameToSocketIds.get(connectedUsernameKey);
        if (set) {
          set.delete(socket.id);
          if (set.size === 0) {
            usernameToSocketIds.delete(connectedUsernameKey);
          }
        }
        socketIdToUsername.delete(socket.id);
      }

      console.log('socket disconnected:', socket.id);
    });

    socket.emit('welcome', `Hello ${user.username}`);
  });

  httpServer.listen(PORT, () => {
    console.log(`Backend Svr listening on http://localhost:${PORT}`);
    console.log(`Proxied app origin: ${APP_ORIGIN}/api`);
    console.log(`Allowed CORS origin(s): ${CORS_ALLOWED_ORIGINS.join(', ')}`);
  });
  return io;
}
