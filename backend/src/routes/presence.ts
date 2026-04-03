import { Router } from 'express';

import { requireAuth, AuthedRequest } from '../auth/middleware.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { touch } from '../utils/presence.js';

export const presenceRouter = Router();

presenceRouter.post(
  '/presence/heartbeat',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) return res.status(401).json({ ok: false });
    touch(req.userId);
    return res.json({ ok: true });
  }),
);
