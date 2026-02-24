import { Router } from 'express';

import { prisma } from '../db.js';
import { requireAuth, AuthedRequest } from '../auth/middleware.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { AuthErrors } from '../errors/catalog.js';

export const usersRouter = Router();

usersRouter.get(
  '/users/me',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        displayname: true,
        email: true,
      },
    });
    if (!user) {
      throw AuthErrors.invalidToken();
    }

    return res.json(user);
  }),
);
