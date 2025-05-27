import fs from 'fs/promises';
import path from 'path';
import { NotFoundError } from '../utils/errors.js';

const BASE_PATH = `${process.cwd()}/data`;

/**
 * Read a file from persistent storage.
 * @param {string} filePath
 * @returns {string}
 */
async function read(filePath) {
  try {
    return await fs.readFile(path.join(BASE_PATH, filePath), {
      encoding: 'utf-8',
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new NotFoundError('File not found', filePath);
    }

    throw error;
  }
}

/**
 * Create a file.
 * @param {string} filePath
 * @param {string} contents
 * @returns {Promise<void>}
 */
function write(filePath, contents) {
  return fs.writeFile(path.join(BASE_PATH, filePath), contents, {
    encoding: 'utf-8',
  });
}

export const fileStorage = {
  write,
  read,
};
