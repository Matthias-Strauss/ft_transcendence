import { createServer } from 'http';
import { WebSocketServer } from 'ws';

import { APP_ORIGIN, PORT } from './config.js';
import { createApp } from './app.js';
import { initFileStorage } from './files/storage.js';

export function startServer() {
  initFileStorage();
  const app = createApp();
  const httpServer = createServer(app);
  const webSocketServer = new WebSocketServer({ port: 3002 });

  console.log('Initialized Websocket server');
  webSocketServer.on('connection', function connection(webSocket: any) {
    webSocket.on('error', console.error);
    webSocket.on('message', function message(data: any) {
      console.log('received: %s', data);
    });
    console.log('Incoming Websocket connection');
  });

  httpServer.listen(PORT, () => {
    console.log(`Backend Svr listening on http://localhost:${PORT}`);
    console.log(`Proxied app origin: ${APP_ORIGIN}`);
  });
}
