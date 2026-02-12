import { Router } from 'express';
import { email, z, ZodError } from 'zod';

import { prisma } from '../db.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { signAccessToken, generateRefreshToken, hashRefreshToken, refreshExpiresAt } from '../auth/jwt.js';
import { REFRESH_COOKIE_NAME, setRefreshCookie, clearRefreshCookie } from '../auth/refresh.js';
import { error } from 'console';

export const authRouter = Router();

// LOGIN
const LoginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

authRouter.post('/auth/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Bad request',
      details: parsed.error.issues,
    });
  }

  const username = parsed.data.username;
  const userExists = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { email: username },
      ],
    },
  });
  if (!userExists) {
    return res.status(401).json({
      error: 'Invalid credentials',
    });
  }

  const passwdCorrect = await verifyPassword(parsed.data.password, userExists.password);
  if (!passwdCorrect) {
    return res.status(401).json({
      error: 'Invalid credentials',
    });
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

  setRefreshCookie(res, refreshToken);

  res.json({ accessToken });
});

// LOGOUT
authRouter.post('/auth/logout', async (req, res) => {
  const refreshToken: string | undefined = req.cookies?.[REFRESH_COOKIE_NAME];

  if (refreshToken) {
    const tokenHash = hashRefreshToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  clearRefreshCookie(res);

  return res.json({ ok: true });
});

// REFRESH
authRouter.post('/auth/refresh', async (req, res) => {
  const refreshToken: string | undefined = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!refreshToken) {
    return res.status(401).json({
      error: 'Missing refresh token',
    });
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!stored || stored.revokedAt) {
    clearRefreshCookie(res);
    return res.status(401).json({
      error: 'Invalid refresh token',
    });
  }

  if (stored.expiresAt.getTime() < Date.now()) {
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    clearRefreshCookie(res);
    return res.status(401).json({
      error: 'Refresh token expired',
    });
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
  setRefreshCookie(res, newRefresh);

  const accessToken = await signAccessToken({
    sub: String(stored.userId),
    username: stored.user.username,
  });

  res.json({ accessToken });
});

// REGISTER
const RegisterSchema = z.object({
  displayname: z.string().min(1).max(30).regex(/^[a-zA-Z0-9._-]+( [a-zA-Z0-9._-]+)*$/),
  username: z.string().trim().toLowerCase().min(3).max(30).regex(/^[a-z0-9._-]+$/),
  email: z.email().optional(),
  password: z.string().min(3).max(100),
});

authRouter.post('/auth/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Bad request',
      details: parsed.error.issues,
    });
  }

  const displayname = parsed.data.displayname;
  const username = parsed.data.username;
  const userExists = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        ...(parsed.data.email ? [{ email: parsed.data.email }] : []),
      ],
    },
  });
  if (userExists) {
    return res.status(409).json({
      error: 'User already exists',
    });
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
  console.log(`New user registered: ${username}`)
});
