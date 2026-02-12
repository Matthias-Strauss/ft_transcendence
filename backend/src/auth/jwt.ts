import crypto from 'crypto';
import { SignJWT, jwtVerify } from "jose";

import { JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE } from '../config.js';

export type AccessTokenPayload = {
  sub: string; //user id
  username: string;
};

export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_DAYS = 7;

const enc = new TextEncoder();
const key = enc.encode(JWT_SECRET);

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ username: payload.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(key);
}

export async function verifyAccessToken(token: string) {
  return jwtVerify(token, key, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('base64');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshExpiresAt(): Date {
  return new Date(Date.now() + 1000 * 60 * 60 *24 * REFRESH_TOKEN_DAYS); // ms, s, m, h, d
}
