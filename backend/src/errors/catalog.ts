import { AppError } from './error.js';

export const ERROR_CATALOG = {
  BAD_REQUEST: {
    statusCode: 400,
    message: 'Bad request',
    errCode: 'BAD_REQUEST',
  },

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

  INVALID_CREDENTIALS: {
    statusCode: 401,
    message: 'Invalid credentials',
    errCode: 'AUTH_INVALID_CREDENTIALS',
  },
  USER_ALREADY_EXISTS: {
    statusCode: 409,
    message: 'User already exists',
    errCode: 'AUTH_USER_EXISTS',
  },
  MISSING_REFRESH_TOKEN: {
    statusCode: 401,
    message: 'Missing refresh token',
    errCode: 'AUTH_MISSING_REFRESH_TOKEN',
  },
  INVALID_REFRESH_TOKEN: {
    statusCode: 401,
    message: 'Invalid refresh token',
    errCode: 'AUTH_INVALID_REFRESH_TOKEN',
  },
  REFRESH_TOKEN_EXPIRED: {
    statusCode: 401,
    message: 'Refresh token expired',
    errCode: 'AUTH_REFRESH_TOKEN_EXPIRED',
  },

  USER_NOT_FOUND: {
    statusCode: 401,
    message: 'User not found',
    errCode: 'USER_NOT_FOUND',
  },
} as const;

export type ErrorKey = keyof typeof ERROR_CATALOG;

type Overrides = Partial<{
  message: string;
  details: unknown;
}>;

function appError(key: ErrorKey, overrides?: Overrides) {
  const base = ERROR_CATALOG[key];
  return new AppError({ ...base, ...(overrides ?? {}) });
}

export const RequestErrors = {
  badRequest: (details?: unknown) => appError('BAD_REQUEST', details ? { details } : undefined),
};

export const AuthErrors = {
  invalidToken: () => appError('INVALID_TOKEN'),
  missingToken: () => appError('MISSING_TOKEN'),

  invalidCredentials: () => appError('INVALID_CREDENTIALS'),
  userAlreadyExists: () => appError('USER_ALREADY_EXISTS'),

  missingRefreshToken: () => appError('MISSING_REFRESH_TOKEN'),
  invalidRefreshToken: () => appError('INVALID_REFRESH_TOKEN'),
  refreshTokenExpired: () => appError('REFRESH_TOKEN_EXPIRED'),
};

export const UserErrors = {
  userNotFound: () => appError('USER_NOT_FOUND'),
};
