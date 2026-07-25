import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { verifyAuth } from '@/lib/auth';
import { validateImageFile, generateSafeFilename, validateUploadPath } from '@/lib/file-security';
import { checkRateLimit, rateLimitResponse, UPLOAD_LIMIT, addRateLimitHeaders } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

// Ensure upload directory exists
async function ensureUploadDir() {
    if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        
        const { userId } = auth;

        // Rate limiting
        const rateLimit = checkRateLimit(userId, UPLOAD_LIMIT);
        if (!rateLimit.success) {
            return rateLimitResponse(rateLimit);
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Convert file to buffer first for content validation
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Validate file content using magic bytes (not just MIME type)
        const validation = validateImageFile(buffer, MAX_FILE_SIZE);
        
        if (!validation.isValid) {
            return NextResponse.json({ error: validation.error || 'Invalid file' }, { status: 400 });
        }

        // Ensure upload directory exists
        await ensureUploadDir();

        // Generate safe filename using detected extension (not user-provided)
        const filename = generateSafeFilename(userId, validation.ext!, 'upload');
        
        // Validate path doesn't escape upload directory
        const filepath = validateUploadPath(UPLOAD_DIR, filename);
        if (!filepath) {
            return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
        }

        // Save file
        await writeFile(filepath, buffer);

        // Return the public URL
        const url = `/uploads/${filename}`;

        const response = NextResponse.json({ url }, { status: 200 });
        return addRateLimitHeaders(response, rateLimit);
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}

