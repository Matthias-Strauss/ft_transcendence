// env input validation. set dafaultValue as a fallback.
// leave defaultValue blank to thow an error if this env value is required.
// - defaultValue is set -> console warning
// - defaultValue undefined -> triggers error
function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  const parsed = value !== undefined ? Number(value) : NaN;

  if (value !== undefined && !Number.isNaN(parsed)) {
    return parsed;
  }
  if (defaultValue === undefined) {
    throw new Error(`[CONFIG] ${key} is not a valid number or not set! This value is required!`);
  } else {
    console.warn(
      `[CONFIG] ${key} is not a valid number or not set. Falling back to default: "${defaultValue}"`,
    );
    return defaultValue;
  }
}

function getEnvString(key: string, defaultValue?: string): string {
  const value = process.env[key];

  if (value && value.length > 0) {
    return value;
  }
  if (defaultValue === undefined) {
    throw new Error(`[CONFIG] ${key} is not set! This value is required!`);
  } else {
    console.warn(`[CONFIG] ${key} is not set. Falling back to default: "${defaultValue}"`);
    return defaultValue;
  }
}

function getEnvCsv(key: string, defaultValue: string[]): string[] {
  const value = process.env[key];

  if (!value || value.trim().length === 0) {
    return defaultValue;
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function getEnvEnum<T extends string>(
  key: string,
  allowedValues: readonly T[],
  defaultValue: T,
): T {
  const value = process.env[key]?.trim();

  if (!value) {
    return defaultValue;
  }

  if (allowedValues.includes(value as T)) {
    return value as T;
  }

  console.warn(
    `[CONFIG] ${key} has unsupported value "${value}". Falling back to default: "${defaultValue}"`,
  );
  return defaultValue;
}

export const PORT = getEnvNumber('BACKEND_PORT', 8080);
export const APP_ORIGIN = getEnvString('APP_ORIGIN', 'https://localhost');
export const FRONTEND_ORIGIN = getEnvString('FRONTEND_ORIGIN', 'http://localhost:3000');
export const CORS_ALLOWED_ORIGINS = getEnvCsv('CORS_ALLOWED_ORIGINS', [
  APP_ORIGIN,
  FRONTEND_ORIGIN,
]);
export const TRUST_PROXY_HOPS = getEnvNumber('TRUST_PROXY_HOPS', 1);
export const DATABASE_URL = getEnvString('DATABASE_URL');

export const JWT_SECRET = getEnvString('JWT_SECRET');
export const JWT_ISSUER = getEnvString('JWT_ISSUER', 'transcendence');
export const JWT_AUDIENCE = getEnvString('JWT_AUDIENCE', 'transcendence_client');
export const ACCESS_TOKEN_TTL = getEnvString('ACCESS_TOKEN_TTL', '15m');
export const REFRESH_TOKEN_DAYS = getEnvNumber('REFRESH_TOKEN_TTL_DAYS', 7);
export const COOKIE_SECURE_MODE = getEnvEnum(
  'COOKIE_SECURE_MODE',
  ['auto', 'always', 'never'] as const,
  'auto',
);
export const COOKIE_SAME_SITE = getEnvEnum(
  'COOKIE_SAME_SITE',
  ['lax', 'strict', 'none'] as const,
  'lax',
);

export const FILES_DIR = getEnvString('FILES_DIR', '/data/uploads');
export const AVATAR_MAX_FILE_SIZE_BYTES = getEnvNumber('AVATAR_MAX_FILE_SIZE_BYTES', 2097152);
export const DEFAULT_AVATAR_FILENAME = getEnvString('DEFAULT_AVATAR_FILENAME', 'default.svg');
