import multer from 'multer';
import type { NextFunction, Response, Request } from 'express';
import crypto from 'crypto';
import fs from 'fs/promises';
import { fileTypeFromFile } from 'file-type';

import { resolveInFilesDir } from './storage.js';
import { FileErrors, RequestErrors } from '../errors/catalog.js';
import { POST_IMAGE_MAX_FILE_SIZE_BYTES } from '../config.js';
import { AuthedRequest } from '../auth/middleware.js';

const POST_IMAGE_MIME_MAP = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
} as const;

type AllowedPostImageMime = keyof typeof POST_IMAGE_MIME_MAP;
const POST_IMAGE_ALLOWED_MIME_TYPES = Object.keys(POST_IMAGE_MIME_MAP) as AllowedPostImageMime[];

function getPostImgMimeExt(mime: string): string | undefined {
  return POST_IMAGE_MIME_MAP[mime as AllowedPostImageMime];
}

const postImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, resolveInFilesDir('posts'));
  },
  filename: (_req, file, cb) => {
    const ext = getPostImgMimeExt(file.mimetype);
    if (!ext) {
      return cb(
        FileErrors.invalidFileType({
          allowed: POST_IMAGE_ALLOWED_MIME_TYPES,
          received: file.mimetype,
        }),
        '',
      );
    }

    const imageUUID = crypto.randomUUID();
    cb(null, `post_${imageUUID}_${Date.now()}${ext}`);
  },
});

const postImageUpload = multer({
  storage: postImageStorage,
  limits: {
    fileSize: POST_IMAGE_MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (!getPostImgMimeExt(file.mimetype)) {
      return cb(
        FileErrors.invalidFileType({
          allowed: POST_IMAGE_ALLOWED_MIME_TYPES,
          received: file.mimetype,
        }),
      );
    }
    cb(null, true);
  },
});

export function postImageUploadHandler(req: AuthedRequest, res: Response, next: NextFunction) {
  const handler = postImageUpload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]);

  handler(req as Request, res, async (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            FileErrors.fileTooLarge({
              maxBytes: POST_IMAGE_MAX_FILE_SIZE_BYTES,
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

      const uploadedImages = files?.image ?? [];
      const uploadedFiles = files?.file ?? [];
      const totalUploads = uploadedImages.length + uploadedFiles.length;

      if (totalUploads > 1) {
        await Promise.all(
          [...uploadedImages, ...uploadedFiles].map((file) =>
            fs.unlink(file.path).catch(() => undefined),
          ),
        );
        return next(
          RequestErrors.badRequest({
            field: 'image',
            message: 'Only one post image can be uploaded',
          }),
        );
      }

      const uploaded = uploadedImages[0] ?? uploadedFiles[0];

      if (!uploaded) {
        return next();
      }

      const detectedType = await fileTypeFromFile(uploaded.path);

      if (!detectedType) {
        await fs.unlink(uploaded.path).catch(() => undefined);
        return next(
          FileErrors.invalidFileType({
            allowed: POST_IMAGE_ALLOWED_MIME_TYPES,
            received: 'unknown',
          }),
        );
      }

      if (!POST_IMAGE_ALLOWED_MIME_TYPES.includes(detectedType.mime as AllowedPostImageMime)) {
        await fs.unlink(uploaded.path).catch(() => undefined);
        return next(
          FileErrors.invalidFileType({
            allowed: POST_IMAGE_ALLOWED_MIME_TYPES,
            received: detectedType.mime,
          }),
        );
      }

      const expectedExt = getPostImgMimeExt(detectedType.mime);
      if (!expectedExt || !uploaded.filename.endsWith(expectedExt)) {
        await fs.unlink(uploaded.path).catch(() => undefined);
        return next(
          FileErrors.invalidFileType({
            allowed: POST_IMAGE_ALLOWED_MIME_TYPES,
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

export function getPostImageUrlFromPath(imagePath: string | null) {
  if (!imagePath) {
    return null;
  }
  return `/files/${imagePath}`;
}

export function getUploadedPostImageFromReq(req: AuthedRequest) {
  const uploadedFiles = req.files as
    | { [fieldname: string]: Express.Multer.File[] | undefined }
    | undefined;

  return uploadedFiles?.image?.[0] ?? uploadedFiles?.file?.[0];
}

export async function cleanupUploadedPostImage(req: AuthedRequest) {
  const uploadedPostImage = getUploadedPostImageFromReq(req);

  if (uploadedPostImage) {
    await fs.unlink(uploadedPostImage.path).catch(() => undefined);
  }
}
