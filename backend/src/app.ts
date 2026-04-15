import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import { requireAuth } from './auth/middleware.js';
import { CORS_ALLOWED_ORIGINS, TRUST_PROXY_HOPS } from './config.js';
import { errorHandler, notFoundHandler } from './errors/error.js';
import { requirePostMediaAccess } from './files/postings.js';
import { getFilesDir } from './files/storage.js';
import { authRouter } from './routes/auth.js';
import { chatRouter } from './routes/chat.js';
import { healthRouter } from './routes/health.js';
import { meRouter } from './routes/me.js';
import { postsRouter } from './routes/posts.js';
import { presenceRouter } from './routes/presence.js';
import { testRouter } from './routes/test.js';
import { uploadsRouter } from './routes/upload.js';
import { usersRouter } from './routes/users.js';
import { requireChatMediaAccess } from './files/chatPdfs.js';

function createAPI() {
  const api = express.Router();

  api.use(healthRouter);
  api.use(authRouter);
  api.use(testRouter);
  api.use(usersRouter);
  api.use(presenceRouter);
  api.use(uploadsRouter);
  api.use(chatRouter);
  api.use(postsRouter);
  api.use(meRouter);

  return api;
}

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }

  return CORS_ALLOWED_ORIGINS.includes(origin);
}

export function createApp() {
  const app = express();

  app.set('trust proxy', TRUST_PROXY_HOPS);

  app.use(
    cors({
      origin(origin, callback) {
        if (isAllowedOrigin(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin ?? 'unknown'} is not allowed by CORS`));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use(
    '/files',
    requireAuth,
    requirePostMediaAccess,
    requireChatMediaAccess,
    express.static(getFilesDir(), {
      index: false,
      dotfiles: 'deny',
      maxAge: '1d',
      fallthrough: false,
      redirect: false,
    }),
  );

  app.use('/api', createAPI());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
