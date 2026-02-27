import type { NextFunction, Response, Request } from 'express';
import multer from 'multer';

import { AuthedRequest } from '../auth/middleware.js';
import { resolveInFilesDir } from './storage.js';
import { FileErrors } from '../errors/catalog.js';
import { AVATAR_MAX_FILE_SIZE_BYTES } from '../config.js';

const AVATAR_MIME_MAP = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
} as const;

type AllowedAvatarMime = keyof typeof AVATAR_MIME_MAP;
const AVATAR_ALLOWED_MIME_TYPES = Object.keys(AVATAR_MIME_MAP) as AllowedAvatarMime[];

function getMimeExt(mime: string): string | undefined {
  return AVATAR_MIME_MAP[mime as AllowedAvatarMime];
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, resolveInFilesDir('avatars'));
  },
  filename: (req, file, cb) => {
    const userId = (req as AuthedRequest).userId ?? 'unknown';
    const ext = getMimeExt(file.mimetype);
    if (!ext) {
      return cb(
        FileErrors.invalidFileType({
          allowed: AVATAR_ALLOWED_MIME_TYPES,
          received: file.mimetype,
        }),
        '',
      );
    }
    cb(null, `avatar_${userId}_${Date.now()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: AVATAR_MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (!AVATAR_ALLOWED_MIME_TYPES.includes(file.mimetype as AllowedAvatarMime)) {
      return cb(
        FileErrors.invalidFileType({
          allowed: AVATAR_ALLOWED_MIME_TYPES,
          received: file.mimetype,
        }),
      );
    }
    cb(null, true);
  },
});

export function avatarUploadHandler(req: AuthedRequest, res: Response, next: NextFunction) {
  const handler = avatarUpload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]);
  handler(req as Request, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          FileErrors.fileTooLarge({
            maxBytes: AVATAR_MAX_FILE_SIZE_BYTES,
          }),
        );
      }
    }
    return next(err);
  });
}
