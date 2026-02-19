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

export const PORT = getEnvNumber('BACKEND_PORT', 8080);
export const FRONTEND_ORIGIN = getEnvString('FRONTEND_ORIGIN', 'http://localhost:3000');
export const DATABASE_URL = getEnvString('DATABASE_URL');

export const JWT_SECRET = getEnvString('JWT_SECRET');
export const JWT_ISSUER = getEnvString('JWT_ISSUER', 'transcendence');
export const JWT_AUDIENCE = getEnvString('JWT_AUDIENCE', 'transcendence_client');
export const ACCESS_TOKEN_TTL = getEnvString('ACCESS_TOKEN_TTL', '15m');
export const REFRESH_TOKEN_DAYS = getEnvNumber('REFRESH_TOKEN_TTL_DAYS', 7);
