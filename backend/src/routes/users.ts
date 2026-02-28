import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { prisma } from '../db.js';
import { requireAuth, AuthedRequest } from '../auth/middleware.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { AuthErrors, RequestErrors, UserErrors } from '../errors/catalog.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { clearRefreshCookie } from '../auth/refresh.js';
import { getAvatarUrlFromPath } from '../files/avatars.js';

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
        avatarPath: true,
      },
    });
    if (!user) {
      throw AuthErrors.invalidToken();
    }

    const { avatarPath, ...safeUser } = user;
    return res.json({
      ...safeUser,
      avatarUrl: getAvatarUrlFromPath(avatarPath),
    });
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

type PrismaUniqueError = {
  code?: unknown;
  message?: unknown;
  meta?: {
    target?: unknown;
    modelName?: unknown;
    driverAdapterError?: unknown;
  };
};

function prismaUniqueToUserError(err: unknown) {
  if (typeof err !== 'object' || err === null) {
    return null;
  }

  const e = err as PrismaUniqueError;

  if (e.code !== 'P2002') {
    return null;
  }

  const targetRaw = e.meta?.target;
  const targets: string[] = (
    Array.isArray(targetRaw) ? targetRaw : targetRaw ? [targetRaw] : []
  ).map((t: unknown) => String(t).toLowerCase());

  const joinedTargets = targets.join(',');

  const msg = String(e.message ?? '').toLowerCase();

  const mentionsUsername =
    targets.includes('username') ||
    joinedTargets.includes('username') ||
    msg.includes('(`username`)') ||
    msg.includes('(username)') ||
    msg.includes('`username`') ||
    msg.includes(' username');

  const mentionsEmail =
    targets.includes('email') ||
    joinedTargets.includes('email') ||
    msg.includes('(`email`)') ||
    msg.includes('(email)') ||
    msg.includes('`email`') ||
    msg.includes(' email');

  if (mentionsUsername) {
    return UserErrors.usernameTaken();
  }
  if (mentionsEmail) {
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
          avatarPath: true,
        },
      });

      const { avatarPath, ...safeUser } = updated;
      return res.json({
        ...safeUser,
        avatarUrl: getAvatarUrlFromPath(avatarPath),
      });
    } catch (err) {
      const conflict = prismaUniqueToUserError(err);
      if (conflict) {
        throw conflict;
      }

      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw AuthErrors.invalidToken();
      }

      throw err;
    }
  }),
);

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(100),
    newPassword: z.string().min(3).max(100),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.currentPassword === val.newPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'New password must be different from current password',
        path: ['newPassword'],
      });
    }
  });

usersRouter.put(
  '/users/me/change-password',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const parsed = ChangePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      throw RequestErrors.badRequest(parsed.error.issues);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        password: true,
      },
    });
    if (!user) {
      throw AuthErrors.invalidToken();
    }

    const passwordCorrect = await verifyPassword(parsed.data.currentPassword, user.password);
    if (!passwordCorrect) {
      throw UserErrors.currentPasswordIncorrect();
    }

    const newPasswordHash = await hashPassword(parsed.data.newPassword);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: newPasswordHash },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    clearRefreshCookie(res);

    return res.json({ ok: true });
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
        avatarPath: true,
      },
    });
    if (!user) {
      throw UserErrors.userNotFound();
    }

    return res.json({
      username: user.username,
      displayname: user.displayname,
      avatarUrl: getAvatarUrlFromPath(user.avatarPath),
    });
  }),
);
