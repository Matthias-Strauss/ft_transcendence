import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../db.js';

export const authRouter = Router();

const LoginSchema = z.object({
  username: z.string(),
  password: z.string(),
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
  const user = await prisma.user.findFirst({
    where: { username },
  });
  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials',
    });
  }

  res.json({ ok: true });
});

authRouter.post('/auth/register', async (req, res) => {
  res.json({ ok: true });
});
