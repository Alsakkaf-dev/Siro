import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const APP_ROOT = path.resolve(__dirname, '..');
export const RESOURCE_ROOT = path.resolve(APP_ROOT, '..', 'Resource', 'Finals Subjects');
export const CONVERTED_DIR = path.join(APP_ROOT, 'converted');
export const CONTENT_DIR = path.join(APP_ROOT, 'content');
export const DATA_DIR = path.join(APP_ROOT, 'data');
export const DIST_DIR = path.join(APP_ROOT, 'dist');
export const PORT = process.env.PORT || 5050;
