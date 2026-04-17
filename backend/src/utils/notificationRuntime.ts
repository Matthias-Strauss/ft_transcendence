import { getRealtimeRuntime } from '../ws/runtime.js';

export function emitNotificationToRecipient(notification: any) {
  try {
    const runtime = getRealtimeRuntime();
    if (!runtime) return;

    const recipientUsername = (notification as any)?.recipient?.username;
    if (!recipientUsername) return;

    const sockets = runtime.registry.getSocketsByUsername(recipientUsername);
    if (!sockets || sockets.size === 0) return;

    for (const sid of sockets) {
      try {
        runtime.io.to(sid).emit('notification', notification);
      } catch (e) {}
    }
  } catch (e) {}
}
