import { io } from 'socket.io-client';

const socketBaseUrl =
  window.location.port === '3000'
    ? `${window.location.protocol}//${window.location.hostname}:8080`
    : window.location.origin;

export const socket = io(socketBaseUrl, {
  path: '/socket.io',
  withCredentials: true,
  transports: ['websocket'],
  autoConnect: false,
});

export function connectSocketWithToken(token: string): void {
  socket.auth = { token };

  if (!socket.connected) {
    socket.connect();
  }
}

export function connectSocketFromStorage(): boolean {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    disconnectSocket();
    return false;
  }

  connectSocketWithToken(token);
  return true;
}

export function disconnectSocket(): void {
  if (socket.connected) {
    socket.disconnect();
  }
}
