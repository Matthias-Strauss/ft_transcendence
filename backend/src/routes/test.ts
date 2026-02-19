import { Router } from 'express';

import { prisma } from '../db.js';
import { requireAuth, AuthedRequest } from '../auth/middleware.js';

export const testRouter = Router();

testRouter.get('/test', requireAuth, async (req: AuthedRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const usr = await prisma.user.findUnique({
    where: { id: req.userId },
  });

  if (!usr) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  return res.json({
    token: 'ok',
    user: req.username,
  });
});
