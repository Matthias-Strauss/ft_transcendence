import type { Server as SocketIOServer } from 'socket.io';

import type { UserSocketRegistry } from './registry.js';

type RealtimeRuntime = {
  io: SocketIOServer;
  registry: UserSocketRegistry;
};

let runtime: RealtimeRuntime | null = null;

export function setRealtimeRuntime(io: SocketIOServer, registry: UserSocketRegistry) {
  runtime = { io, registry };
}

export function getRealtimeRuntime() {
  return runtime;
}
