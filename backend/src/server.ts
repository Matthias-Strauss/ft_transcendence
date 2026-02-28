import { createServer } from 'http';

import { PORT } from './config.js';
import { createApp } from './app.js';
import { initFileStorage } from './files/storage.js';

export function startServer() {
  initFileStorage();
  const app = createApp();
  const httpServer = createServer(app);

  httpServer.listen(PORT, () => {
    console.log(`Backend Svr listening on http://localhost:${PORT}`);
  });
}
