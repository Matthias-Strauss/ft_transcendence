import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../db.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshExpiresAt,
} from '../auth/jwt.js';
import { REFRESH_COOKIE_NAME, setRefreshCookie, clearRefreshCookie } from '../auth/refresh.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { AuthErrors, RequestErrors } from '../errors/catalog.js';

export const authRouter = Router();

// LOGIN
const LoginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

authRouter.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw RequestErrors.badRequest(parsed.error.issues);
    }

    const username = parsed.data.username;
    const userExists = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
    });
    if (!userExists) {
      throw AuthErrors.invalidCredentials();
    }

    const passwdCorrect = await verifyPassword(parsed.data.password, userExists.password);
    if (!passwdCorrect) {
      throw AuthErrors.invalidCredentials();
    }

    const accessToken = await signAccessToken({
      sub: String(userExists.id),
      username: userExists.username,
    });

    const refreshToken = generateRefreshToken();
    const refreshHash = hashRefreshToken(refreshToken);
    await prisma.refreshToken.create({
      data: {
        userId: userExists.id,
        tokenHash: refreshHash,
        expiresAt: refreshExpiresAt(),
      },
    });

    setRefreshCookie(req, res, refreshToken);

    res.json({ accessToken });
  }),
);

// LOGOUT
authRouter.post(
  '/auth/logout',
  asyncHandler(async (req, res) => {
    const refreshToken: string | undefined = req.cookies?.[REFRESH_COOKIE_NAME];

    if (refreshToken) {
      const tokenHash = hashRefreshToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    clearRefreshCookie(req, res);

    return res.json({ ok: true });
  }),
);

// REFRESH
authRouter.post(
  '/auth/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken: string | undefined = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw AuthErrors.missingRefreshToken();
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!stored || stored.revokedAt) {
      clearRefreshCookie(req, res);
      throw AuthErrors.invalidRefreshToken();
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      await prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });
      clearRefreshCookie(req, res);
      throw AuthErrors.refreshTokenExpired();
    }

    const newRefresh = generateRefreshToken();
    const newHash = hashRefreshToken(newRefresh);
    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          userId: stored.userId,
          tokenHash: newHash,
          expiresAt: refreshExpiresAt(),
        },
      }),
    ]);
    setRefreshCookie(req, res, newRefresh);

    const accessToken = await signAccessToken({
      sub: String(stored.userId),
      username: stored.user.username,
    });

    res.json({ accessToken });
  }),
);

// REGISTER
const RegisterSchema = z.object({
  displayname: z
    .string()
    .min(1)
    .max(30)
    .regex(/^[a-zA-Z0-9._-]+( [a-zA-Z0-9._-]+)*$/),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9._-]+$/),
  email: z.email().optional(),
  password: z.string().min(3).max(100),
});

authRouter.post(
  '/auth/register',
  asyncHandler(async (req, res) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      throw RequestErrors.badRequest(parsed.error.issues);
    }

    const displayname = parsed.data.displayname;
    const username = parsed.data.username;
    const userExists = await prisma.user.findFirst({
      where: {
        OR: [{ username }, ...(parsed.data.email ? [{ email: parsed.data.email }] : [])],
      },
    });
    if (userExists) {
      throw AuthErrors.userAlreadyExists();
    }

    const passwordHash = await hashPassword(parsed.data.password);

    await prisma.user.create({
      data: {
        username,
        password: passwordHash,
        email: parsed.data.email,
        displayname,
      },
    });

    res.status(201).json({
      username,
      displayname,
    });
    console.log(`New user registered: ${username}`);
  }),
);
