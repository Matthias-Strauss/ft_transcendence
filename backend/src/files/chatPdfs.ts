import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'node:fs/promises';
import { fileTypeFromFile } from 'file-type';

import { AuthedRequest } from '../auth/middleware.js';
import { resolveInFilesDir, normalizeRequestedFilePath } from './storage.js';
import { CHAT_PDF_MAX_FILE_SIZE_BYTES } from '../config.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { AuthErrors, FileErrors } from '../errors/catalog.js';
import { prisma } from '../db.js';

const CHAT_PDF_MIME_MAP = {
  'application/pdf': '.pdf',
} as const;

type AllowedChatPdfMime = keyof typeof CHAT_PDF_MIME_MAP;
const CHAT_PDF_ALLOWED_MIME_TYPES = Object.keys(CHAT_PDF_MIME_MAP) as AllowedChatPdfMime[];
const CHAT_PDF_PATH_PREFIX = 'chat-pdfs/';
const CHAT_PDF_FILENAME_PREFIX = 'chat_pdf_';
const CHAT_PDF_STORAGE_DIR = 'chat-pdfs';

export type ChatPdfMetadata = {
  kind: 'chat_pdf';
  originalName: string;
  mimeType: 'application/pdf';
  sizeBytes: number;
  storagePath: string;
  fileUrl: string;
};

function getMimeExt(mime: string): string | undefined {
  return CHAT_PDF_MIME_MAP[mime as AllowedChatPdfMime];
}

export async function ensureChatPdfStorageDir() {
  await fs.mkdir(resolveInFilesDir(CHAT_PDF_STORAGE_DIR), { recursive: true });
}

const chatPdfStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, resolveInFilesDir(CHAT_PDF_STORAGE_DIR));
  },
  filename: (_req, file, cb) => {
    const ext = getMimeExt(file.mimetype);
    if (!ext) {
      return cb(
        FileErrors.invalidFileType({
          allowed: CHAT_PDF_ALLOWED_MIME_TYPES,
          received: file.mimetype,
        }),
        '',
      );
    }

    cb(null, `chat_pdf_upload_${crypto.randomUUID()}_${Date.now()}${ext}`);
  },
});

const chatPdfUpload = multer({
  storage: chatPdfStorage,
  limits: {
    fileSize: CHAT_PDF_MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (!getMimeExt(file.mimetype)) {
      return cb(
        FileErrors.invalidFileType({
          allowed: CHAT_PDF_ALLOWED_MIME_TYPES,
          received: file.mimetype,
        }),
      );
    }

    cb(null, true);
  },
});

export function chatPdfUploadHandler(req: AuthedRequest, res: Response, next: NextFunction) {
  void ensureChatPdfStorageDir()
    .then(() => {
      const handler = chatPdfUpload.fields([
        { name: 'pdf', maxCount: 1 },
        { name: 'file', maxCount: 1 },
      ]);

      handler(req as Request, res, async (err: unknown) => {
        if (err) {
          if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            return next(
              FileErrors.fileTooLarge({
                maxBytes: CHAT_PDF_MAX_FILE_SIZE_BYTES,
              }),
            );
          }

          return next(err);
        }

        try {
          const uploaded = getUploadedChatPdfFromReq(req);
          if (!uploaded) {
            return next(FileErrors.missingFile());
          }

          let detectedType;
          try {
            detectedType = await fileTypeFromFile(uploaded.path);
          } catch (error) {
            await fs.unlink(uploaded.path).catch(() => undefined);
            return next(
              FileErrors.invalidFileType({
                allowed: CHAT_PDF_ALLOWED_MIME_TYPES,
                received: uploaded.mimetype || 'unknown',
                reason: 'signature_detection_failed',
                cause: error instanceof Error ? error.message : String(error),
              }),
            );
          }

          if (!detectedType) {
            await fs.unlink(uploaded.path).catch(() => undefined);
            return next(
              FileErrors.invalidFileType({
                allowed: CHAT_PDF_ALLOWED_MIME_TYPES,
                received: 'unknown',
              }),
            );
          }

          if (!CHAT_PDF_ALLOWED_MIME_TYPES.includes(detectedType.mime as AllowedChatPdfMime)) {
            await fs.unlink(uploaded.path).catch(() => undefined);
            return next(
              FileErrors.invalidFileType({
                allowed: CHAT_PDF_ALLOWED_MIME_TYPES,
                received: detectedType.mime,
              }),
            );
          }

          const expectedExt = getMimeExt(detectedType.mime);
          if (!expectedExt || !uploaded.filename.endsWith(expectedExt)) {
            await fs.unlink(uploaded.path).catch(() => undefined);
            return next(
              FileErrors.invalidFileType({
                allowed: CHAT_PDF_ALLOWED_MIME_TYPES,
                received: `${uploaded.mimetype} (declared), detected: ${detectedType.mime}`,
                reason: 'extension_mismatch',
              }),
            );
          }

          return next();
        } catch (error) {
          return next(error);
        }
      });
    })
    .catch((error) => next(error));
}

export function getUploadedChatPdfFromReq(req: AuthedRequest) {
  const uploadedFiles = req.files as
    | { [fieldname: string]: Express.Multer.File[] | undefined }
    | undefined;

  return uploadedFiles?.pdf?.[0] ?? uploadedFiles?.file?.[0];
}

export async function cleanupUploadedChatPdf(req: AuthedRequest) {
  const uploadedChatPdf = getUploadedChatPdfFromReq(req);

  if (uploadedChatPdf) {
    await fs.unlink(uploadedChatPdf.path).catch(() => undefined);
  }
}

export function getChatPdfUrlFromPath(filePath: string) {
  return `/files/${filePath}`;
}

export function buildChatPdfStoragePath(messageId: string) {
  return `${CHAT_PDF_PATH_PREFIX}${CHAT_PDF_FILENAME_PREFIX}${messageId}_${Date.now()}.pdf`;
}

export function buildChatPdfMetadata(params: {
  originalName: string;
  sizeBytes: number;
  storagePath: string;
}): ChatPdfMetadata {
  return {
    kind: 'chat_pdf',
    originalName: params.originalName,
    mimeType: 'application/pdf',
    sizeBytes: params.sizeBytes,
    storagePath: params.storagePath,
    fileUrl: getChatPdfUrlFromPath(params.storagePath),
  };
}

export function getChatPdfStoragePathFromMetadata(metadata: unknown) {
  if (!isChatPdfMetadata(metadata)) {
    return null;
  }

  return metadata.storagePath;
}

export async function deleteStoredChatPdf(filePath: string) {
  await fs.unlink(resolveInFilesDir(filePath)).catch(() => undefined);
}

export function getChatPdfMessageIdFromPath(filePath: string) {
  const normalized = normalizeRequestedFilePath(filePath);

  if (!normalized.startsWith(CHAT_PDF_PATH_PREFIX)) {
    return null;
  }

  const filename = normalized.slice(CHAT_PDF_PATH_PREFIX.length);
  if (!filename.startsWith(CHAT_PDF_FILENAME_PREFIX) || !filename.endsWith('.pdf')) {
    return null;
  }

  const withoutPrefix = filename.slice(CHAT_PDF_FILENAME_PREFIX.length, -'.pdf'.length);
  const lastSeparatorIdx = withoutPrefix.lastIndexOf('_');
  if (lastSeparatorIdx <= 0) {
    return null;
  }

  return withoutPrefix.slice(0, lastSeparatorIdx);
}

export function isChatPdfMetadata(value: unknown): value is ChatPdfMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const metadata = value as Record<string, unknown>;
  return (
    metadata.kind === 'chat_pdf' &&
    metadata.mimeType === 'application/pdf' &&
    typeof metadata.storagePath === 'string' &&
    typeof metadata.fileUrl === 'string' &&
    typeof metadata.originalName === 'string' &&
    typeof metadata.sizeBytes === 'number'
  );
}

export const requireChatMediaAccess = asyncHandler(
  async (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const requestedFilePath = normalizeRequestedFilePath(req.path);
    const messageId = getChatPdfMessageIdFromPath(requestedFilePath);

    if (!messageId) {
      return next();
    }

    const message = await prisma.directMessage.findUnique({
      where: {
        id: messageId,
      },
      select: {
        id: true,
        senderId: true,
        recipientId: true,
        metadata: true,
      },
    });

    if (!message || !message.metadata || !isChatPdfMetadata(message.metadata)) {
      throw FileErrors.fileNotFound();
    }

    if (message.metadata.storagePath !== requestedFilePath) {
      throw FileErrors.fileNotFound();
    }

    if (message.senderId !== req.userId && message.recipientId !== req.userId) {
      throw FileErrors.fileNotFound();
    }

    return next();
  },
);
