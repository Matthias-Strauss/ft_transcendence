import path from 'node:path';
import fs from 'node:fs';

import { FILES_DIR } from '../config.js';

export function getFilesDir() {
  return path.resolve(FILES_DIR);
}

export function initFileStorage() {
  const baseDir = getFilesDir();
  const avatarsDir = path.join(baseDir, 'avatars');

  fs.mkdirSync(baseDir, { recursive: true });
  fs.mkdirSync(avatarsDir, { recursive: true });
}

export function resolveInFilesDir(relPath: string) {
  const baseDir = getFilesDir();
  const fullPath = path.resolve(baseDir, relPath);
  const relativePath = path.relative(baseDir, fullPath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('AA Invalid Path');
  }

  return fullPath;
}
