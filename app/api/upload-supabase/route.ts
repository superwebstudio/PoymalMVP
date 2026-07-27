import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

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

  // Concurrent create is fine — treat "already exists" as success
  if (createError && !/already exists|duplicate/i.test(createError.message)) {
    throw new Error(createError.message || `Unable to create bucket ${bucket}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { userId } = auth;

    const supabase = createServerSupabaseClient();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'File must be an image or video' }, { status: 400 });
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension =
      file.name.split('.').pop() || (isImage ? 'jpg' : 'mp4');
    const fileName = `${userId}-${timestamp}-${randomString}.${extension}`;

    const folder = formData.get('folder');
    const isAvatar =
      typeof folder === 'string' && folder === 'avatars' && isImage;

    const bucket = isImage ? IMAGE_BUCKET : VIDEO_BUCKET;
    const filePath = isAvatar ? `avatars/${fileName}` : `${bucket}/${fileName}`;

    await ensurePublicBucket(supabase, bucket, isImage);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type,
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

    return NextResponse.json({ url: publicUrl }, { status: 200 });
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
