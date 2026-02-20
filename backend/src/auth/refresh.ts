import { Response } from 'express';
import { REFRESH_TOKEN_DAYS } from '../config.js';

export const REFRESH_COOKIE_NAME = 'refresh_token';
export const REFRESH_COOKIE_PATH = '/api/auth/';

const isProd = process.env.NODE_ENV === 'production';
export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: REFRESH_COOKIE_PATH,
    maxAge: 1000 * 60 * 60 * 24 * REFRESH_TOKEN_DAYS,
  };
}

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions());
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...refreshCookieOptions(),
    maxAge: undefined,
  });
}
