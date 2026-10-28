import fs from 'fs';
import path from 'path';
import os from 'os';

export const ALLOWED_EXTENSIONS = new Set(['.mp4', '.mov', '.webm', '.m4v', '.mkv', '.avi']);

export const MIME_MAP: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
};

export function resolveLocalVideoPath(rawPath: string): string | null {
  if (!rawPath || typeof rawPath !== 'string') return null;
  let cleaned = rawPath.trim();

  // Strip file:// protocol if present
  if (cleaned.startsWith('file://')) {
    cleaned = decodeURIComponent(cleaned.replace(/^file:\/\//, ''));
  }

  // Remove surrounding quotes if user copied path with quotes
  cleaned = cleaned.replace(/^["']|["']$/g, '');

  // Expand ~ to user home directory
  if (cleaned.startsWith('~')) {
    cleaned = path.join(os.homedir(), cleaned.slice(1));
  }

  // Normalize path candidates to check
  const candidates: string[] = [
    cleaned,
    path.resolve(process.cwd(), cleaned),
    path.resolve(process.cwd(), 'public', cleaned.replace(/^\/+/, '')),
    path.resolve(process.cwd(), 'public', 'video', path.basename(cleaned)),
    path.resolve(process.cwd(), 'public', 'video', cleaned),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        const stat = fs.statSync(candidate);
        if (stat.isFile()) {
          const ext = path.extname(candidate).toLowerCase();
          if (ALLOWED_EXTENSIONS.has(ext)) {
            return candidate;
          }
        }
      }
    } catch {}
  }

  return null;
}
