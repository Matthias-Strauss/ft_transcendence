import express from 'express';
import cors from 'cors';

import { FRONTEND_ORIGIN } from './config.js';
import { healthRouter } from './routes/health.js';

function createAPI() {
	const api = express.Router();

	api.use(healthRouter);

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

  app.use('/api', createAPI());

  return app;
}
