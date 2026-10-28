import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Readable } from 'stream';
import { resolveLocalVideoPath, ALLOWED_EXTENSIONS, MIME_MAP } from '@/lib/reveal-day/video-resolver';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawPath = searchParams.get('path');

  if (!rawPath) {
    return NextResponse.json({ error: 'MISSING_PATH_PARAMETER' }, { status: 400 });
  }

  const resolvedPath = resolveLocalVideoPath(rawPath);
  if (!resolvedPath) {
    return NextResponse.json(
      {
        error: 'VIDEO_NOT_FOUND',
        message: '지정한 경로의 동영상 파일을 찾을 수 없습니다. 경로를 다시 확인해주세요.',
        requestedPath: rawPath,
      },
      { status: 404 }
    );
  }

  try {
    const stat = fs.statSync(resolvedPath);
    const fileSize = stat.size;
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_MAP[ext] || 'video/mp4';

    const range = request.headers.get('range');

    if (range) {
      // Parse Range header e.g. "bytes=0-1024" or "bytes=1024-"
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        return new Response('Requested Range Not Satisfiable', {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;
      const nodeStream = fs.createReadStream(resolvedPath, { start, end });
      const webStream = Readable.toWeb(nodeStream);

      return new Response(webStream as ReadableStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } else {
      // Full file stream
      const nodeStream = fs.createReadStream(resolvedPath);
      const webStream = Readable.toWeb(nodeStream);

      return new Response(webStream as ReadableStream, {
        status: 200,
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': String(fileSize),
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'STREAM_ERROR' }, { status: 500 });
  }
}

export async function HEAD(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawPath = searchParams.get('path');

  if (!rawPath) {
    return new Response(null, { status: 400 });
  }

  const resolvedPath = resolveLocalVideoPath(rawPath);
  if (!resolvedPath) {
    return new Response(null, { status: 404 });
  }

  try {
    const stat = fs.statSync(resolvedPath);
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_MAP[ext] || 'video/mp4';

    return new Response(null, {
      status: 200,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Length': String(stat.size),
        'Content-Type': contentType,
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}

// Support uploading local MP4 file from PC file picker directly to public/video/
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'NO_FILE_PROVIDED' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: 'INVALID_EXTENSION', message: 'MP4, MOV, WEBM 등의 동영상 파일만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.resolve(process.cwd(), 'public', 'video');
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
      const targetPath = path.join(uploadDir, safeName);
      fs.writeFileSync(targetPath, buffer);

      const relativePublicPath = `/video/${safeName}`;

      return NextResponse.json({
        success: true,
        fileName: safeName,
        localPath: targetPath,
        webUrl: `/api/reveal-day/video-file?path=${encodeURIComponent(targetPath)}`,
        publicUrl: relativePublicPath,
      });
    } catch {
      // In serverless environments with read-only root filesystem, fallback to /tmp
      const tmpDir = path.resolve(os.tmpdir(), 'reveal_videos');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
      const tmpPath = path.join(tmpDir, safeName);
      fs.writeFileSync(tmpPath, buffer);

      return NextResponse.json({
        success: true,
        fileName: safeName,
        localPath: tmpPath,
        webUrl: `/api/reveal-day/video-file?path=${encodeURIComponent(tmpPath)}`,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'UPLOAD_FAILED' }, { status: 500 });
  }
}
