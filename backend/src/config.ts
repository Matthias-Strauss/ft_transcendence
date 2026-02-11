import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
export const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';

export const JWT_SECRET = process.env.JWT_SECRET ?? 'transcendence42';
export const JWT_ISSUER = process.env.JWT_ISSUER ?? 'transcendence';
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE ?? 'transcendence_client';
