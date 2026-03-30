import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { APP_ORIGIN, FRONTEND_ORIGIN, PORT } from './config.js';
import { createApp } from './app.js';
import { initFileStorage } from './files/storage.js';
import { verifyAccessToken } from './auth/jwt.js';

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

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('No token provided'));
    }

    try {
      const user = verifyAccessToken(token);
      (socket as any).user = user;
      next();
    } catch (err) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user;
    console.log('Authenticated user connected:', user);
    socket.on('chat:message', (payload: { text: string }) => {
      io.emit('chat:message', { ...payload, from: socket.id });
    });
    socket.on('disconnect', () => {
      console.log('socket disconnected:', socket.id);
    });
    socket.emit('welcome', `Hello ${user.username}`);
  });

  httpServer.listen(PORT, () => {
    console.log(`Backend Svr listening on http://localhost:${PORT}`);
  });
  return io;
}
