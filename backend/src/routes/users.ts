import { Router } from 'express';

import { prisma } from '../db.js';
import { requireAuth, AuthedRequest } from '../auth/middleware.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { AuthErrors, RequestErrors, UserErrors } from '../errors/catalog.js';
import { getAvatarUrlFromPath } from '../files/avatars.js';
import { getPostViewerContext, postAuthorInclude, serializePost } from '../utils/postUtils.js';
import { UsernameSchema } from '../utils/userUtils.js';

export const usersRouter = Router();

usersRouter.get(
  '/users/:username',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const parsed = UsernameSchema.safeParse(req.params);
    if (!parsed.success) {
      throw RequestErrors.badRequest(parsed.error.issues);
    }

    const user = await prisma.user.findUnique({
      where: { username: parsed.data.username },
      select: {
        username: true,
        displayname: true,
        avatarPath: true,
      },
    });
    if (!user) {
      throw UserErrors.userNotFound();
    }

    return res.json({
      username: user.username,
      displayname: user.displayname,
      avatarUrl: getAvatarUrlFromPath(user.avatarPath),
    });
  }),
);

usersRouter.get(
  '/users/:username/posts',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.userId) {
      throw AuthErrors.invalidToken();
    }

    const parsed = UsernameSchema.safeParse(req.params);
    if (!parsed.success) {
      throw RequestErrors.badRequest(parsed.error.issues);
    }

    const user = await prisma.user.findUnique({
      where: { username: parsed.data.username },
      select: { id: true },
    });
    if (!user) {
      throw UserErrors.userNotFound();
    }

    const posts = await prisma.post.findMany({
      where: { authorId: user.id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: postAuthorInclude,
    });

    const { likedPostIds, sharedPostIds } = await getPostViewerContext(
      posts.map((post) => post.id),
      req.userId,
    );
    return res.json({
      items: posts.map((post) =>
        serializePost(post, {
          likedByMe: likedPostIds.has(post.id),
          sharedByMe: sharedPostIds.has(post.id),
        }),
      ),
      meta: {
        total: posts.length,
        order: 'createdAt_desc',
      },
    });
  }),
);
