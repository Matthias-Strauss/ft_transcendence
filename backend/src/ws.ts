import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { APP_ORIGIN, FRONTEND_ORIGIN } from './config.js';
import { authenticateSocket } from './ws/auth.js';
import { bindConnectionHandler } from './ws/connection.js';
import { createUserSocketRegistry } from './ws/registry.js';
import { setRealtimeRuntime } from './ws/runtime.js';

export function setupWebSocket(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: [APP_ORIGIN, FRONTEND_ORIGIN],
      credentials: true,
    },
  });

  const registry = createUserSocketRegistry();

  io.use(authenticateSocket);
  bindConnectionHandler(io, registry);
  setRealtimeRuntime(io, registry);

  return io;
}
