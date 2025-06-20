import fs from 'fs/promises';
import path from 'path';
import { NotFoundError } from '../utils/errors.js';

const BASE_PATH = `${process.cwd()}/data`;

/**
 * Read a file from persistent storage.
 */
async function read(filePath: string): Promise<string> {
  try {
    return await fs.readFile(path.join(BASE_PATH, filePath), {
      encoding: 'utf-8',
    });
  } catch (error) {
    const fsError = error as NodeJS.ErrnoException;
    if (fsError instanceof Error && fsError.code === 'ENOENT') {
      throw new NotFoundError('File not found', filePath);
    }

    throw error;
  }
}

/**
 * write to a file to persistent storage.
 * @param {string} filePath
 */
async function write(filePath: string, contents: string): Promise<void> {
  const fullPath = path.join(BASE_PATH, filePath);
  const dir = path.dirname(fullPath);

  // Create directories if they don't exist
  await fs.mkdir(dir, { recursive: true });

  return fs.writeFile(fullPath, contents, {
    encoding: 'utf-8',
  });
}

export const fileStorage = {
  write,
  read,
};
