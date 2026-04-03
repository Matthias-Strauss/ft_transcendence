import { Router } from 'express';

import { requireAuth, AuthedRequest } from '../auth/middleware.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { AuthErrors } from '../errors/catalog.js';
import { touch } from '../utils/presence.js';

export const presenceRouter = Router();

presenceRouter.post(
  '/presence/heartbeat',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) throw AuthErrors.invalidToken();
    touch(req.userId);
    return res.json({ ok: true });
  }),
);
