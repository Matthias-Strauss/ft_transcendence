import { createServer } from 'http';

import { PORT } from './config.js';
import { createApp } from './app.js';

export function startServer() {
  const app = createApp();
  const httpServer = createServer(app);

  httpServer.listen(PORT, () => {
    console.log(`Backend Svr listening on http://localhost:${PORT}`);
  });
}
