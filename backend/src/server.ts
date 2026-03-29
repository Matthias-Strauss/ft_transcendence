import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { APP_ORIGIN, FRONTEND_ORIGIN, PORT } from './config.js';
import { createApp } from './app.js';
import { initFileStorage } from './files/storage.js';

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

  io.on('connection', (socket) => {
	console.log('socket connected:', socket.id);

	socket.on('chat:message', (payload: { text: string }) => {
		io.emit('chat:message', { ...payload, from :socket.id});
	});

	socket.on('disconnect', () => {
		console.log('socket disconnected:', socket.id);
	});
  });

  httpServer.listen(PORT, () => {
    console.log(`Backend Svr listening on http://localhost:${PORT}`);
  });
}