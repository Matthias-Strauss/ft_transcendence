import { Router } from 'express';

import { AuthedRequest, requireAuth } from '../auth/middleware.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { AuthErrors, PostErrors } from '../errors/catalog.js';
import { prisma } from '../db.js';

export const notificationsRouter = Router();

notificationsRouter.get(
  '/notifications',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) throw AuthErrors.invalidToken();

    const limit = Math.min(100, Number(req.query.limit || 50));

    const items = await prisma.notification.findMany({
      where: { recipientId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        actor: { select: { id: true, username: true, displayname: true, avatarPath: true } },
        post: { select: { id: true, content: true } },
        comment: { select: { id: true, content: true } },
      },
    });

    return res.json({ items });
  }),
);

notificationsRouter.get(
  '/notifications/unread_count',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) throw AuthErrors.invalidToken();

    const unreadCount = await prisma.notification.count({
      where: { recipientId: req.userId, readAt: null },
    });

    return res.json({ unreadCount });
  }),
);

notificationsRouter.post(
  '/notifications/:id/read',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) throw AuthErrors.invalidToken();

    const id = req.params.id;

    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing || existing.recipientId !== req.userId) {
      throw PostErrors.notFound();
    }

    await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });

    return res.json({ ok: true });
  }),
);

notificationsRouter.post(
  '/notifications/mark_all_read',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) throw AuthErrors.invalidToken();

    await prisma.notification.updateMany({
      where: { recipientId: req.userId, readAt: null },
      data: { readAt: new Date() },
    });

    return res.json({ ok: true });
  }),
);

export default notificationsRouter;
