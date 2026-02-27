import { Router } from 'express';

import { AuthedRequest, requireAuth } from '../auth/middleware.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { AuthErrors } from '../errors/catalog.js';
import { avatarUploadHandler } from '../files/avatars.js';
import { FileErrors } from '../errors/catalog.js';

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

    return res.json({ ok: true });
  }),
);
