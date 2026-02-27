import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { FRONTEND_ORIGIN } from './config.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { testRouter } from './routes/test.js';
import { errorHandler, notFoundHandler } from './errors/error.js';
import { usersRouter } from './routes/users.js';

function createAPI() {
  const api = express.Router();

  api.use(healthRouter);
  api.use(authRouter);
  api.use(testRouter);
  api.use(usersRouter);

  return api;
}

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: FRONTEND_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/api', createAPI());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
