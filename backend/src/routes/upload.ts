import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';

import { AuthedRequest, requireAuth } from '../auth/middleware.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { AuthErrors } from '../errors/catalog.js';
import { avatarUploadHandler, getAvatarUrlFromPath } from '../files/avatars.js';
import { FileErrors } from '../errors/catalog.js';
import { prisma } from '../db.js';
import { resolveInFilesDir } from '../files/storage.js';

export const uploadsRouter = Router();

uploadsRouter.post(
  '/uploads/avatar',
  requireAuth,
  avatarUploadHandler,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] | undefined }
      | undefined;
    const uploaded = files?.avatar?.[0] ?? files?.file?.[0];
    if (!uploaded) {
      throw FileErrors.missingFile();
    }

    const newAvatarRelPath = path.posix.join('avatars', uploaded.filename);

    const current = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        avatarPath: true,
      },
    });
    if (!current) {
      await fs.unlink(uploaded.path).catch(() => undefined);
      throw AuthErrors.invalidToken();
    }

    const oldAvatarPath = current.avatarPath;

    try {
      await prisma.user.update({
        where: { id: current.id },
        data: { avatarPath: newAvatarRelPath },
      });
    } catch (err) {
      await fs.unlink(uploaded.path).catch(() => undefined);
      throw err;
    }

    if (oldAvatarPath) {
      const oldAbsPath = resolveInFilesDir(oldAvatarPath);
      await fs.unlink(oldAbsPath).catch(() => undefined);
    }

    return res.json({
      ok: true,
      avatarUrl: getAvatarUrlFromPath(newAvatarRelPath),
    });
  }),
);
