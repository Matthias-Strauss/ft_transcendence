import { createServer } from 'http';

import { APP_ORIGIN, PORT, CORS_ALLOWED_ORIGINS } from './config.js';
import { createApp } from './app.js';
import { initFileStorage } from './files/storage.js';

export function startServer() {
  initFileStorage();
  const app = createApp();
  const httpServer = createServer(app);

  httpServer.listen(PORT, () => {
    console.log(`Backend Svr listening on http://localhost:${PORT}`);
    console.log(`Proxied app origin: ${APP_ORIGIN}/api`);
    console.log(`Allowed CORS origin(s): ${CORS_ALLOWED_ORIGINS.join(', ')}`);
  });
}
