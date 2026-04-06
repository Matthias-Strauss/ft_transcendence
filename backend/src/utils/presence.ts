const LAST_ACTIVITY = new Map<string, number>();

const ONLINE_THRESHOLD_MS = 60 * 1000;

export function touch(userId: string) {
  if (!userId) return;
  LAST_ACTIVITY.set(userId, Date.now());
}

export function isOnline(userId: string) {
  if (!userId) return false;
  const t = LAST_ACTIVITY.get(userId);
  if (!t) return false;
  return Date.now() - t <= ONLINE_THRESHOLD_MS;
}

export function getOnlineUserIds() {
  const now = Date.now();
  const out: string[] = [];
  for (const [id, t] of LAST_ACTIVITY.entries()) {
    if (now - t <= ONLINE_THRESHOLD_MS) out.push(id);
  }
  return out;
}
