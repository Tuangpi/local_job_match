import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function isAllowedImageMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export interface StoredFile {
  storageKey: string;
  size: number;
}

export class LocalFileStorage {
  constructor(
    private readonly dir: string,
    private readonly maxSizeBytes: number,
  ) {}

  async save(buffer: Buffer, mimeType: string): Promise<StoredFile> {
    if (!isAllowedImageMimeType(mimeType)) {
      throw new Error('Unsupported file type.');
    }
    if (buffer.length > this.maxSizeBytes) {
      throw new Error('File too large.');
    }
    await mkdir(this.dir, { recursive: true });
    const extension = extensionForMimeType(mimeType);
    const storageKey = `${crypto.randomUUID()}${extension}`;
    await writeFile(path.join(this.dir, storageKey), buffer);
    return { storageKey, size: buffer.length };
  }
}

function extensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      return '';
  }
}