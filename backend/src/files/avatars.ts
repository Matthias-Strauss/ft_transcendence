import type { NextFunction, Response, Request } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs/promises';
import { fileTypeFromFile } from 'file-type';

import { AuthedRequest } from '../auth/middleware.js';
import { resolveInFilesDir } from './storage.js';
import { FileErrors } from '../errors/catalog.js';
import { AVATAR_MAX_FILE_SIZE_BYTES, DEFAULT_AVATAR_FILENAME } from '../config.js';

export const DEFAULT_AVATAR_REL_PATH = `avatars/${DEFAULT_AVATAR_FILENAME}`;
export const DEFAULT_AVATAR_URL = `/files/${DEFAULT_AVATAR_REL_PATH}`;

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
    const avatarUUID = crypto.randomUUID();
    cb(null, `avatar_${avatarUUID}_${Date.now()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: AVATAR_MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (!getMimeExt(file.mimetype)) {
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

  handler(req as Request, res, async (err: unknown) => {
    if (err) {
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
    }

    try {
      const files = req.files as
        | { [fieldname: string]: Express.Multer.File[] | undefined }
        | undefined;

      const uploaded = files?.avatar?.[0] ?? files?.file?.[0];

      if (!uploaded) {
        return next(FileErrors.missingFile());
      }

      const detectedType = await fileTypeFromFile(uploaded.path);

      if (!detectedType) {
        await fs.unlink(uploaded.path).catch(() => undefined);
        return next(
          FileErrors.invalidFileType({
            allowed: AVATAR_ALLOWED_MIME_TYPES,
            received: 'unknown',
          }),
        );
      }

      if (!AVATAR_ALLOWED_MIME_TYPES.includes(detectedType.mime as AllowedAvatarMime)) {
        await fs.unlink(uploaded.path).catch(() => undefined);
        return next(
          FileErrors.invalidFileType({
            allowed: AVATAR_ALLOWED_MIME_TYPES,
            received: detectedType.mime,
          }),
        );
      }

      const expectedExt = getMimeExt(detectedType.mime);
      if (!expectedExt || !uploaded.filename.endsWith(expectedExt)) {
        await fs.unlink(uploaded.path).catch(() => undefined);
        return next(
          FileErrors.invalidFileType({
            allowed: AVATAR_ALLOWED_MIME_TYPES,
            received: `${uploaded.mimetype} (declared), detected: ${detectedType.mime}`,
            reason: 'extension_mismatch',
          }),
        );
      }

      return next();
    } catch (e) {
      return next(e);
    }
  });
}

export function getAvatarUrlFromPath(avatarPath: string | null) {
  if (!avatarPath) {
    return DEFAULT_AVATAR_URL;
  }
  return `/files/${avatarPath}`;
}

export function isUserUploadedAvatarPath(
  avatarPath: string | null | undefined,
): avatarPath is string {
  return Boolean(
    avatarPath && avatarPath.startsWith('avatars/') && avatarPath !== DEFAULT_AVATAR_REL_PATH,
  );
}
