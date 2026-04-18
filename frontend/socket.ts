import { io } from 'socket.io-client';

const socketBaseUrl =
  window.location.port === '3000'
    ? `${window.location.protocol}//${window.location.hostname}:8080`
    : window.location.origin;

export const socket = io(socketBaseUrl, {
  path: '/socket.io',
  withCredentials: true,
  transports: ['websocket'],
  autoConnect: false,
  reconnection: false,
});

const RECONNECT_DELAY_MS = 3000;

let shouldMaintainSocketConnection = false;
let reconnectsBlocked = false;
let reconnectTimer: number | null = null;
let beforeSocketConnect: (() => Promise<boolean>) | null = null;
let connectingPromise: Promise<boolean> | null = null;

function clearReconnectTimer() {
  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function scheduleReconnect(delayMs = RECONNECT_DELAY_MS) {
  if (!shouldMaintainSocketConnection || reconnectsBlocked || reconnectTimer !== null) {
    return;
  }

  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    void connectSocket();
  }, delayMs);
}

async function runBeforeConnectHook(): Promise<boolean> {
  if (!beforeSocketConnect) {
    return true;
  }

  try {
    return await beforeSocketConnect();
  } catch {
    return false;
  }
}

export function setBeforeSocketConnectHook(hook: (() => Promise<boolean>) | null): void {
  beforeSocketConnect = hook;
}

export function checkSocketConnectionIsUsd(): boolean {
  return shouldMaintainSocketConnection;
}

export function blockSocketReconnects(): void {
  reconnectsBlocked = true;
  clearReconnectTimer();
}

export function unblockSocketReconnects(): void {
  reconnectsBlocked = false;

  if (shouldMaintainSocketConnection && !socket.connected && !socket.active) {
    scheduleReconnect(0);
  }
}

export function connectSocket(options: { forceReconnect?: boolean } = {}): Promise<boolean> {
  shouldMaintainSocketConnection = true;

  if (reconnectsBlocked) {
    return Promise.resolve(false);
  }

  if (socket.connected) {
    if (options.forceReconnect) {
      socket.disconnect();
    } else {
      return Promise.resolve(true);
    }
  }

  if (socket.active) {
    return Promise.resolve(true);
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = (async () => {
    const sessionReady = await runBeforeConnectHook();

    if (!sessionReady || reconnectsBlocked || !shouldMaintainSocketConnection) {
      return false;
    }

    clearReconnectTimer();
    socket.connect();
    return true;
  })();

  connectingPromise.finally(() => {
    connectingPromise = null;
  });

  return connectingPromise;
}

export function disconnectSocket(): void {
  shouldMaintainSocketConnection = false;
  clearReconnectTimer();
  socket.disconnect();
}

socket.on('connect', () => {
  clearReconnectTimer();
});

socket.on('disconnect', () => {
  if (!shouldMaintainSocketConnection || reconnectsBlocked) {
    return;
  }

  scheduleReconnect();
});

socket.on('connect_error', () => {
  if (!shouldMaintainSocketConnection || reconnectsBlocked || socket.connected) {
    return;
  }

  scheduleReconnect();
});
