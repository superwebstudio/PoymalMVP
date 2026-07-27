import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';
import { bugReportSchema, validateBody, formatZodError } from '@/lib/validations';
import {
  checkRateLimit,
  rateLimitResponse,
  BUG_REPORT_LIMIT,
  addRateLimitHeaders,
} from '@/lib/rate-limit';
import { validateImageFile, generateSafeFilename } from '@/lib/file-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB per image
const BUG_BUCKET = 'catch-images';

async function ensurePublicBucket(supabase: SupabaseClient): Promise<void> {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    throw new Error(listError.message || 'Unable to list storage buckets');
  }

  if (buckets?.some((item) => item.name === BUG_BUCKET)) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(BUG_BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/heic',
    ],
  });

  if (createError && !/already exists|duplicate/i.test(createError.message)) {
    throw new Error(createError.message || `Unable to create bucket ${BUG_BUCKET}`);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId } = auth;

    const rateLimit = checkRateLimit(userId, BUG_REPORT_LIMIT);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const formData = await request.formData();
    const description = formData.get('description') as string;
    const deviceInfo = formData.get('deviceInfo') as string;
    const appVersion = formData.get('appVersion') as string;

    const validation = validateBody(bugReportSchema, {
      description,
      deviceInfo,
      appVersion,
    });
    if (!validation.success) {
      return NextResponse.json(
        { error: formatZodError(validation.error) },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();
    await ensurePublicBucket(supabase);

    const imageUrls: string[] = [];
    const imageKeys = Array.from(formData.keys()).filter((key) =>
      key.startsWith('image'),
    );
    const limitedImageKeys = imageKeys.slice(0, MAX_IMAGES);

    for (const key of limitedImageKeys) {
      const file = formData.get(key) as File | null;
      if (!file || file.size <= 0) continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const imageValidation = validateImageFile(buffer, MAX_IMAGE_SIZE);
      if (!imageValidation.isValid) {
        console.warn(
          `Skipping invalid image in bug report: ${imageValidation.error}`,
        );
        continue;
      }

      const filename = generateSafeFilename(
        userId,
        imageValidation.ext!,
        'bug',
      );
      const filePath = `bug-reports/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from(BUG_BUCKET)
        .upload(filePath, buffer, {
          contentType: imageValidation.mime || 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.warn('Bug report image upload failed:', uploadError.message);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUG_BUCKET).getPublicUrl(filePath);
      imageUrls.push(publicUrl);
    }

    console.log('Bug Report:', {
      userId,
      description: validation.data.description,
      deviceInfo: validation.data.deviceInfo || 'Unknown',
      appVersion: validation.data.appVersion || '1.0.0',
      imageUrls,
      timestamp: new Date().toISOString(),
    });

    const response = NextResponse.json(
      { success: true, message: 'Bug report submitted successfully' },
      { status: 200 },
    );
    return addRateLimitHeaders(response, rateLimit);
  } catch (error) {
    console.error('Bug report error:', error);
    return NextResponse.json(
      { error: 'Failed to submit bug report' },
      { status: 500 },
    );
  }
}
