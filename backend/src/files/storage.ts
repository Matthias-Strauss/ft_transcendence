import path from 'node:path';

import { FILES_DIR } from '../config.js';

export function getFilesDir() {
  return path.resolve(FILES_DIR);
}
