import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../db.js';

export const authRouter = Router();

const dummyPassword = "55789e79eca2f9a1e0786388b869f34f28a64ccbc37eb85ceeb031fd9677e06e"; // passwort123 SHA-256 hex

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

const RegisterSchema = z.object({
  displayname: z.string().min(1).max(30),
  username: z.string().trim().min(3).max(30),
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
    where: { username },
  });
  if (userExists) {
    return res.status(409).json({
      error: 'User already exists',
    });
  }

  await prisma.user.create({
    data: {
      username,
      password: dummyPassword,
      displayname,
    },
  });

  res.status(201).json({
    username,
    displayname,
  });
  console.log(`New user registered: ${username}`)
});
