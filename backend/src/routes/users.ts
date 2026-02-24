import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../db.js';
import { requireAuth, AuthedRequest } from '../auth/middleware.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { AuthErrors, RequestErrors, UserErrors } from '../errors/catalog.js';

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

const UsernameSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9._-]+$/),
});

usersRouter.get(
  '/users/:username',
  asyncHandler(async (requireAuth, res) => {
    const parsed = UsernameSchema.safeParse(requireAuth.params);
    if (!parsed.success) {
      throw RequestErrors.badRequest(parsed.error.issues);
    }

    const user = await prisma.user.findUnique({
      where: { username: parsed.data.username },
      select: {
        username: true,
        displayname: true,
      },
    });
    if (!user) {
      throw UserErrors.userNotFound();
    }

    return res.json(user);
  }),
);
