import type { Response, CookieOptions, Request } from 'express';

import { REFRESH_TOKEN_DAYS, COOKIE_SAME_SITE, COOKIE_SECURE_MODE } from '../config.js';

export const REFRESH_COOKIE_NAME = 'refresh_token';
export const REFRESH_COOKIE_PATH = '/api/auth/';

function resolveCookieSecure(req: Request): boolean {
  if (COOKIE_SECURE_MODE === 'always') {
    return true;
  }

  if (COOKIE_SECURE_MODE === 'never') {
    return false;
  }

  return req.secure;
}

export function refreshCookieOptions(req: Request): CookieOptions {
  return {
    httpOnly: true,
    secure: resolveCookieSecure(req),
    sameSite: COOKIE_SAME_SITE,
    path: REFRESH_COOKIE_PATH,
    maxAge: 1000 * 60 * 60 * 24 * REFRESH_TOKEN_DAYS,
  };
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
