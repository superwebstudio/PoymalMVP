import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { verifyAuth } from '@/lib/auth';
import { bugReportSchema, validateBody, formatZodError } from '@/lib/validations';
import { checkRateLimit, rateLimitResponse, BUG_REPORT_LIMIT, addRateLimitHeaders } from '@/lib/rate-limit';
import { validateImageFile, generateSafeFilename, validateUploadPath } from '@/lib/file-security';

const UPLOAD_DIR = join(process.cwd(), 'public', 'bug-reports');
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB per image

async function ensureUploadDir() {
    if (!existsSync(UPLOAD_DIR)) {
        mkdirSync(UPLOAD_DIR, { recursive: true });
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

        // Rate limiting (strict - only 5 per hour)
        const rateLimit = checkRateLimit(userId, BUG_REPORT_LIMIT);
        if (!rateLimit.success) {
            return rateLimitResponse(rateLimit);
        }

        const formData = await request.formData();
        const description = formData.get('description') as string;
        const deviceInfo = formData.get('deviceInfo') as string;
        const appVersion = formData.get('appVersion') as string;

        // Validate input
        const validation = validateBody(bugReportSchema, { description, deviceInfo, appVersion });
        if (!validation.success) {
            return NextResponse.json({ error: formatZodError(validation.error) }, { status: 400 });
        }

        // Ensure upload directory exists
        await ensureUploadDir();

        // Handle image uploads with security validation
        const imageUrls: string[] = [];
        const imageKeys = Array.from(formData.keys()).filter(key => key.startsWith('image'));
        
        // Limit number of images
        const limitedImageKeys = imageKeys.slice(0, MAX_IMAGES);
        
        for (const key of limitedImageKeys) {
            const file = formData.get(key) as File;
            if (file && file.size > 0) {
                // Convert to buffer for validation
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);
                
                // Validate image content (magic bytes)
                const imageValidation = validateImageFile(buffer, MAX_IMAGE_SIZE);
                if (!imageValidation.isValid) {
                    // Skip invalid images but don't fail the whole request
                    console.warn(`Skipping invalid image in bug report: ${imageValidation.error}`);
                    continue;
                }

                // Generate safe filename
                const filename = generateSafeFilename(userId, imageValidation.ext!, 'bug');
                
                // Validate path
                const filepath = validateUploadPath(UPLOAD_DIR, filename);
                if (!filepath) {
                    console.warn('Path validation failed for bug report image');
                    continue;
                }

                // Save file
                await writeFile(filepath, buffer);
                imageUrls.push(`/bug-reports/${filename}`);
            }
        }

        // Log the bug report
        console.log('Bug Report:', {
            userId,
            description: validation.data.description,
            deviceInfo: validation.data.deviceInfo || 'Unknown',
            appVersion: validation.data.appVersion || '1.0.0',
            imageUrls,
            timestamp: new Date().toISOString(),
        });

        // TODO: Save to database (create BugReport model in Prisma)

        const response = NextResponse.json(
            { success: true, message: 'Bug report submitted successfully' },
            { status: 200 }
        );
        return addRateLimitHeaders(response, rateLimit);
    } catch (error) {
        console.error('Bug report error:', error);
        return NextResponse.json(
            { error: 'Failed to submit bug report' },
            { status: 500 }
        );
    }
}











