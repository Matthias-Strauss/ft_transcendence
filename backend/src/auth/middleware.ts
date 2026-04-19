import type { Request, Response, NextFunction } from 'express';

import { verifyAccessToken } from './jwt.js';
import { SESSION_COOKIE_NAME } from './refresh.js';
import { touch as touchPresence } from '../utils/presence.js';
import { AuthErrors } from '../errors/catalog.js';

export type AuthedRequest = Request & {
  userId?: string;
  username?: string;
};

function getBearerToken(authorizationHeader: string | undefined): string | undefined {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return undefined;
  }

  return authorizationHeader.slice('Bearer '.length);
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE_NAME] ?? getBearerToken(req.headers.authorization);

  if (!token) {
    return next(AuthErrors.missingToken());
  }

  try {
    const { payload } = await verifyAccessToken(token);

    if (
      !payload.sub ||
      typeof payload.sub !== 'string' ||
      !payload.username ||
      typeof payload.username !== 'string'
    ) {
      return next(AuthErrors.invalidToken());
    }

    req.userId = payload.sub;
    req.username = payload.username;

    try {
      touchPresence(payload.sub);
    } catch {
      return next();
    }

    return next();
  } catch {
    return next(AuthErrors.invalidToken());
  }
}
