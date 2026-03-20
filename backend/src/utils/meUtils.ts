import { UserErrors } from '../errors/catalog.js';

type PrismaUniqueError = {
  code?: unknown;
  message?: unknown;
  meta?: {
    target?: unknown;
    modelName?: unknown;
    driverAdapterError?: unknown;
  };
};

export function prismaUniqueToUserError(err: unknown) {
  if (typeof err !== 'object' || err === null) {
    return null;
  }

  const e = err as PrismaUniqueError;

  if (e.code !== 'P2002') {
    return null;
  }

  const targetRaw = e.meta?.target;
  const targets: string[] = (
    Array.isArray(targetRaw) ? targetRaw : targetRaw ? [targetRaw] : []
  ).map((t: unknown) => String(t).toLowerCase());

  const joinedTargets = targets.join(',');

  const msg = String(e.message ?? '').toLowerCase();

  const mentionsUsername =
    targets.includes('username') ||
    joinedTargets.includes('username') ||
    msg.includes('(`username`)') ||
    msg.includes('(username)') ||
    msg.includes('`username`') ||
    msg.includes(' username');

  const mentionsEmail =
    targets.includes('email') ||
    joinedTargets.includes('email') ||
    msg.includes('(`email`)') ||
    msg.includes('(email)') ||
    msg.includes('`email`') ||
    msg.includes(' email');

  if (mentionsUsername) {
    return UserErrors.usernameTaken();
  }
  if (mentionsEmail) {
    return UserErrors.emailTaken();
  }

  return null;
}
