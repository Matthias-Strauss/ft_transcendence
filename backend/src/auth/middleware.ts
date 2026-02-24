import type { Request, Response, NextFunction } from 'express';

import { verifyAccessToken } from './jwt.js';
import { AuthErrors } from '../errors/catalog.js';

export type AuthedRequest = Request & {
  userId?: string;
  username?: string;
};

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return next(AuthErrors.missingToken());
  }

  const token = auth.slice('Bearer '.length);

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
    return next();
  } catch {
    return next(AuthErrors.invalidToken());
  }
}
