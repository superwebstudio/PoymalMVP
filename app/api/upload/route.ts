import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';
import {
  validateImageFile,
  generateSafeFilename,
} from '@/lib/file-security';
import {
  checkRateLimit,
  rateLimitResponse,
  UPLOAD_LIMIT,
  addRateLimitHeaders,
} from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const IMAGE_BUCKET = 'catch-images';
const VIDEO_BUCKET = 'catch-videos';

async function ensurePublicBucket(
  supabase: SupabaseClient,
  bucket: string,
  isImage: boolean,
): Promise<void> {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    throw new Error(listError.message || 'Unable to list storage buckets');
  }

  if (buckets?.some((item) => item.name === bucket)) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: MAX_FILE_SIZE,
    allowedMimeTypes: isImage
      ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
      : ['video/mp4', 'video/webm', 'video/quicktime'],
  });

  if (createError && !/already exists|duplicate/i.test(createError.message)) {
    throw new Error(createError.message || `Unable to create bucket ${bucket}`);
  }
}

/**
 * Legacy `/api/upload` — must use object storage on Vercel (EROFS on /var/task).
 * Prefer `/api/upload-supabase` for new callers; this route stays for catch logging.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId } = auth;

    const rateLimit = checkRateLimit(userId, UPLOAD_LIMIT);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/') || !isVideo;

    let contentType = file.type || 'application/octet-stream';
    let extension = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
    let filename: string;

    if (isVideo) {
      filename = generateSafeFilename(userId, extension, 'upload');
    } else {
      const validation = validateImageFile(buffer, MAX_FILE_SIZE);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error || 'Invalid file' },
          { status: 400 },
        );
      }
      extension = validation.ext || 'jpg';
      contentType = validation.mime || 'image/jpeg';
      filename = generateSafeFilename(userId, extension, 'upload');
    }

    const folder = formData.get('folder');
    const isAvatar =
      typeof folder === 'string' && folder === 'avatars' && !isVideo;

    const bucket = isVideo ? VIDEO_BUCKET : IMAGE_BUCKET;
    const filePath = isAvatar
      ? `avatars/${filename}`
      : `${bucket}/${filename}`;

    const supabase = createServerSupabaseClient();
    await ensurePublicBucket(supabase, bucket, !isVideo);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: uploadError.message || 'Failed to upload file' },
        { status: 500 },
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    const response = NextResponse.json({ url: publicUrl }, { status: 200 });
    return addRateLimitHeaders(response, rateLimit);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to upload file',
      },
      { status: 500 },
    );
  }
}
