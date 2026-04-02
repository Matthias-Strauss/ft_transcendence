import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { Socket } from 'socket.io';

import { APP_ORIGIN, PORT, CORS_ALLOWED_ORIGINS } from './config.js';
import { createApp } from './app.js';
import { initFileStorage } from './files/storage.js';
import { verifyAccessToken } from './auth/jwt.js';

type SocketUser = {
  id: string;
  username: string;
};

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

      (socket as any).user = user;
      next();
    } catch (err) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    console.log('Authenticated user connected:', user);
    socket.on('chat:message', (payload: { text: string }) => {
      io.emit('chat:message', { ...payload, from: socket.id, username: user.username });
    });
    socket.on('disconnect', () => {
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
