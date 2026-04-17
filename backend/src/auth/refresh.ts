import type { Response, CookieOptions, Request } from 'express';

import {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_DAYS,
  COOKIE_SAME_SITE,
  COOKIE_SECURE_MODE,
} from '../config.js';

export const SESSION_COOKIE_NAME = 'session_token';
export const SESSION_COOKIE_PATH = '/';
export const REFRESH_COOKIE_NAME = 'refresh_token';
export const REFRESH_COOKIE_PATH = '/';

const TTL_UNITS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
} as const;

function translateDurationToMs(value: string): number {
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error(`Config: invalid time format: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2] as keyof typeof TTL_UNITS;

  return amount * TTL_UNITS[unit];
}

export const ACCESS_TOKEN_MAX_AGE_MS = translateDurationToMs(ACCESS_TOKEN_TTL);

function resolveCookieSecure(req: Request): boolean {
  if (COOKIE_SECURE_MODE === 'always') {
    return true;
  }

  if (COOKIE_SECURE_MODE === 'never') {
    return false;
  }

  return req.secure;
}

function cookieBaseOptions(req: Request): Pick<CookieOptions, 'httpOnly' | 'secure' | 'sameSite'> {
  return {
    httpOnly: true,
    secure: resolveCookieSecure(req),
    sameSite: COOKIE_SAME_SITE,
  };
}

export function sessionCookieOptions(req: Request): CookieOptions {
  return {
    ...cookieBaseOptions(req),
    path: SESSION_COOKIE_PATH,
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  };
}

export function refreshCookieOptions(req: Request): CookieOptions {
  return {
    ...cookieBaseOptions(req),
    path: REFRESH_COOKIE_PATH,
    maxAge: 1000 * 60 * 60 * 24 * REFRESH_TOKEN_DAYS,
  };
}

export function setSessionCookie(req: Request, res: Response, token: string) {
  res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(req));
}

export function clearSessionCookie(req: Request, res: Response) {
  const cookieOptions = sessionCookieOptions(req);
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: cookieOptions.path,
  });
}

export function setRefreshCookie(req: Request, res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions(req));
}

export function clearRefreshCookie(req: Request, res: Response) {
  const cookieOptions = refreshCookieOptions(req);
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: cookieOptions.path,
  });
}

export function getCookieValue(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  const pairs = cookieHeader.split(';');

  for (const pair of pairs) {
    const trimmed = pair.trim();

    if (!trimmed) {
      continue;
    }

    const eqIdx = trimmed.indexOf('=');
    const key = eqIdx >= 0 ? trimmed.slice(0, eqIdx) : trimmed;

    if (key !== name) {
      continue;
    }

    const raw = eqIdx >= 0 ? trimmed.slice(eqIdx + 1) : '';
    return decodeURIComponent(raw);
  }

  return undefined;
}
