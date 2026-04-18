import { verifyAccessToken } from '../auth/jwt.js';
import { getCookieValue, SESSION_COOKIE_NAME } from '../auth/refresh.js';
import type { Socket } from 'socket.io';

import type { SocketUser } from './types.js';

export async function authenticateSocket(socket: Socket, next: (err?: Error) => void) {
  const token =
    getCookieValue(socket.handshake.headers.cookie, SESSION_COOKIE_NAME) ??
    socket.handshake.auth?.token;

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
}
