import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Marks `dist-cjs/` as CommonJS.
 *
 * The package root says `"type": "module"`, so without this file node would read
 * the CJS build the backend `require`s as ESM and fail on `exports`.
 */
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

await writeFile(
  path.join(rootDir, 'dist-cjs', 'package.json'),
  JSON.stringify({ type: 'commonjs' }, null, 2),
);
