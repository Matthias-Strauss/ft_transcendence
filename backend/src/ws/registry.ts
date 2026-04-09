import { normalizeUsername } from './username.js';

export type UserSocketRegistry = {
  addConnection: (username: string, socketId: string) => string;
  removeConnection: (socketId: string) => void;
  getSocketsByUsername: (username: string) => Set<string> | undefined;
};

export function createUserSocketRegistry(): UserSocketRegistry {
  const usernameToSocketIds = new Map<string, Set<string>>();
  const socketIdToUsername = new Map<string, string>();

  function addConnection(username: string, socketId: string): string {
    const usernameKey = normalizeUsername(username);
    const existing = usernameToSocketIds.get(usernameKey) ?? new Set<string>();

    existing.add(socketId);
    usernameToSocketIds.set(usernameKey, existing);
    socketIdToUsername.set(socketId, usernameKey);

    return usernameKey;
  }

  function removeConnection(socketId: string): void {
    const connectedUsernameKey = socketIdToUsername.get(socketId);
    if (!connectedUsernameKey) {
      return;
    }

    const sockets = usernameToSocketIds.get(connectedUsernameKey);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        usernameToSocketIds.delete(connectedUsernameKey);
      }
    }

    socketIdToUsername.delete(socketId);
  }

  function getSocketsByUsername(username: string): Set<string> | undefined {
    return usernameToSocketIds.get(normalizeUsername(username));
  }

  return {
    addConnection,
    removeConnection,
    getSocketsByUsername,
  };
}
