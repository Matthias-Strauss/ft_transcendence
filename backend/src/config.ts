import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PORT = process.env.BACKEND_PORT ? Number(process.env.BACKEND_PORT) : 8080;
export const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';

export const JWT_SECRET = process.env.JWT_SECRET ?? 'transcendence42';
export const JWT_ISSUER = process.env.JWT_ISSUER ?? 'transcendence';
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE ?? 'transcendence_client';
export const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL ?? '15m';
export const REFRESH_TOKEN_DAYS = process.env.REFRESH_TOKEN_DAYS ? Number(process.env.REFRESH_TOKEN_DAYS) : 7;
