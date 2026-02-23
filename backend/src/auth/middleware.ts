import type { Request, Response, NextFunction } from 'express';

import { verifyAccessToken } from './jwt.js';
import { AppError } from '../errors/error.js';

export type AuthedRequest = Request & {
  userId?: string;
  username?: string;
};

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return next(
      new AppError({
        statusCode: 401,
        message: 'Missing token',
        errCode: 'AUTH_MISSING_TOKEN',
      }),
    );
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
      return next(
        new AppError({
          statusCode: 401,
          message: 'Invalid token',
          errCode: 'AUTH_INVALID_TOKEN',
        }),
      );
    }

    req.userId = payload.sub;
    req.username = payload.username;
    return next();
  } catch {
    return next(
      new AppError({
        statusCode: 401,
        message: 'Invalid token',
        errCode: 'AUTH_INVALID_TOKEN',
      }),
    );
  }
}
