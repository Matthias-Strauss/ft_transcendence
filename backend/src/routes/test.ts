import { Router } from 'express';

import { prisma } from '../db.js';
import { requireAuth, AuthedRequest } from '../auth/middleware.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { AuthErrors } from '../errors/catalog.js';

export const testRouter = Router();

testRouter.get(
  '/test',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const usr = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!usr) {
      throw AuthErrors.invalidToken();
    }

    return res.json({
      token: 'ok',
      user: req.username,
    });
  }),
);
