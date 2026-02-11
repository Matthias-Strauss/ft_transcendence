import crypto from 'crypto';
import { SignJWT, jwtVerify } from "jose";

import { JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE } from '../config.js';

export type AccessTokenPayload = {
  sub: string; //user id
  username: string;
};

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
