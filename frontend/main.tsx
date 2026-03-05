import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { WebSocket } from 'ws';

import App from './App';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
const webSocket = new WebSocket("ws://localhost:3002");
webSocket.on('open', function open() {
  console.log("Connection to server established");
});
