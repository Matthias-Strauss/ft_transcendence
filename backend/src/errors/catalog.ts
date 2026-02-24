import { AppError } from './error.js';

export const ERROR_CATALOG = {
  INVALID_TOKEN: {
    statusCode: 401,
    message: 'Invalid token',
    errCode: 'AUTH_INVALID_TOKEN',
  },
  MISSING_TOKEN: {
    statusCode: 401,
    message: 'Missing token',
    errCode: 'AUTH_MISSING_TOKEN',
  },
} as const;

export type ErrorKey = keyof typeof ERROR_CATALOG;

function appError(key: ErrorKey) {
  const base = ERROR_CATALOG[key];
  return new AppError(base);
}

export const AuthErrors = {
  invalidToken: () => appError('INVALID_TOKEN'),
  missingToken: () => appError('MISSING_TOKEN'),
};
