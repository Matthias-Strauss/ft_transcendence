import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export type ErrorResponseBody = {
  success: false;
  message: string;
  errCode: string;
  details?: unknown;
};

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errCode: string;
  public readonly details?: unknown;

  constructor(opts: { statusCode: number; message: string; errCode: string; details?: unknown }) {
    super(opts.message);
    this.name = 'AppError';
    this.statusCode = opts.statusCode;
    this.errCode = opts.errCode;
    this.details = opts.details;
  }
}

function normalizeError(err: unknown): { statusCode: number; body: ErrorResponseBody } {
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      body: {
        success: false,
        message: err.message,
        errCode: err.errCode,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    };
  }

  if (err instanceof ZodError) {
    return {
      statusCode: 400,
      body: {
        success: false,
        message: 'Bad request',
        errCode: 'VALIDATION_ERROR',
        details: err.issues,
      },
    };
  }

  return {
    statusCode: 500,
    body: {
      success: false,
      message: 'Internal server error',
      errCode: 'INTERNAL_ERROR',
    },
  };
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(
    new AppError({
      statusCode: 404,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      errCode: 'NOT_FOUND',
    }),
  );
}

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) return next(err);

  const { statusCode, body } = normalizeError(err);
  return res.status(statusCode).json(body);
}
