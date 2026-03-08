import path from 'node:path';
import fs from 'node:fs';

import { DEFAULT_AVATAR_FILENAME, FILES_DIR } from '../config.js';

export function getFilesDir() {
  return path.resolve(FILES_DIR);
}

function copyDefaultAvatar(avatarsDir: string) {
  const srcPath = path.resolve(process.cwd(), 'assets', DEFAULT_AVATAR_FILENAME);
  const targetPath = path.join(avatarsDir, DEFAULT_AVATAR_FILENAME);
  if (!fs.existsSync(srcPath)) {
    throw new Error(`[FILES] User default avatar missing at ${srcPath}`);
  }

  fs.copyFileSync(srcPath, targetPath);
}

function copySeedPostAssets(postsDir: string) {
  const seedAssetImages = [
    'seed-post-1.svg',
    'seed-post-2.svg',
    'seed-post-3.svg',
    'seed-post-4.svg',
  ];

  for (const assetFilename of seedAssetImages) {
    const srcPath = path.resolve(process.cwd(), 'assets', assetFilename);
    const targetPath = path.join(postsDir, assetFilename);
    if (!fs.existsSync(srcPath)) {
      throw new Error(`[FILES] required asset missing at ${srcPath}`);
    }
    if (!fs.existsSync(targetPath)) {
      fs.copyFileSync(srcPath, targetPath);
    }
  }
}

export function initFileStorage() {
  const baseDir = getFilesDir();
  const avatarsDir = path.join(baseDir, 'avatars');
  const postsDir = path.join(baseDir, 'posts');

  fs.mkdirSync(baseDir, { recursive: true });
  fs.mkdirSync(avatarsDir, { recursive: true });
  fs.mkdirSync(postsDir, { recursive: true });

  copyDefaultAvatar(avatarsDir);
  copySeedPostAssets(postsDir);
}

export function resolveInFilesDir(relPath: string) {
  const baseDir = getFilesDir();
  const fullPath = path.resolve(baseDir, relPath);
  const relativePath = path.relative(baseDir, fullPath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('Invalid file path');
  }

  return fullPath;
}
