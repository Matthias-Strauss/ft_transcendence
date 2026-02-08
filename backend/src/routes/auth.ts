import { Router } from 'express';

export const authRouter = Router();

authRouter.post('/auth/login', async (req, res) => {
  res.json({ ok: true });
});

authRouter.post('/auth/register', async (req, res) => {
  res.json({ ok: true });
});
