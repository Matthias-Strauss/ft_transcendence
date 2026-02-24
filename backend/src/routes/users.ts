import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

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

const UpdateMeSchema = z
  .object({
    displayname: z
      .string()
      .min(1)
      .max(30)
      .regex(/^[a-zA-Z0-9._-]+( [a-zA-Z0-9._-]+)*$/)
      .optional(),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3)
      .max(30)
      .regex(/^[a-z0-9._-]+$/)
      .optional(),
    email: z.union([z.email(), z.null()]).optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.displayname === undefined && val.username === undefined && val.email === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least one parameter needs to be provided',
        path: [],
      });
    }
  });

function prismaUniqueToUserError(err: unknown) {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }
  if (err.code !== 'P2002') {
    return null;
  }

  const target = (err.meta as { target?: unknown } | undefined)?.target;
  const fields = Array.isArray(target) ? target : target ? [target] : [];
  if (fields.includes('username')) {
    return UserErrors.usernameTaken();
  }
  if (fields.includes('email')) {
    return UserErrors.emailTaken();
  }
  return null;
}

usersRouter.patch(
  '/users/me',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const parsed = UpdateMeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw RequestErrors.badRequest(parsed.error.issues);
    }

    const updateData: {
      displayname?: string;
      username?: string;
      email?: string | null;
    } = {};

    if (parsed.data.displayname !== undefined) updateData.displayname = parsed.data.displayname;
    if (parsed.data.username !== undefined) updateData.username = parsed.data.username;
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email;

    try {
      const updated = await prisma.user.update({
        where: { id: req.userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          displayname: true,
          email: true,
        },
      });

      return res.json(updated);
    } catch (err) {
      const conflict = prismaUniqueToUserError(err);
      if (conflict) {
        throw conflict;
      }

      throw err;
    }
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
  asyncHandler(async (req, res) => {
    const parsed = UsernameSchema.safeParse(req.params);
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
