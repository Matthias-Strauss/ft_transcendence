import { Router } from 'express';

import { AuthedRequest, requireAuth } from '../auth/middleware.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { AuthErrors } from '../errors/catalog.js';

export const postsRouter = Router();

postsRouter.get(
  '/posts',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    res.json({ ok: true });
  }),
);

postsRouter.post(
  '/posts',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    res.json({ ok: true });
  }),
);

postsRouter.get(
  '/posts/:id',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    res.json({ ok: true });
  }),
);

postsRouter.delete(
  '/posts/:id',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    res.json({ ok: true });
  }),
);
