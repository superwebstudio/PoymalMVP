import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSavedLocations } from './_service';
import { verifyAuth } from '@/lib/auth';
import { createSavedLocationSchema, validateBody, formatZodError } from '@/lib/validations';
import { checkRateLimit, rateLimitResponse, STANDARD_LIMIT, addRateLimitHeaders } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        
        const { userId } = auth;

        const savedLocations = await getSavedLocations(userId);

        return NextResponse.json(savedLocations);
    } catch (error) {
        console.error('Get saved locations error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
        const rateLimit = checkRateLimit(userId, STANDARD_LIMIT);
        if (!rateLimit.success) {
            return rateLimitResponse(rateLimit);
        }

        const body = await request.json();
        
        // Validate input
        const validation = validateBody(createSavedLocationSchema, body);
        if (!validation.success) {
            return NextResponse.json({ error: formatZodError(validation.error) }, { status: 400 });
        }
        
        const { name, latitude, longitude } = validation.data;

        // Check if location already exists (within 0.0001 degree tolerance)
        const existingLocation = await prisma.savedLocation.findFirst({
            where: {
                userId,
                latitude: {
                    gte: latitude - 0.0001,
                    lte: latitude + 0.0001,
                },
                longitude: {
                    gte: longitude - 0.0001,
                    lte: longitude + 0.0001,
                },
            },
        });

        if (existingLocation) {
            return NextResponse.json({ error: 'Location already saved' }, { status: 409 });
        }

        const newLocation = await prisma.savedLocation.create({
            data: {
                userId,
                name: name || 'Saved Location',
                latitude,
                longitude,
            },
        });

        const response = NextResponse.json(newLocation, { status: 201 });
        return addRateLimitHeaders(response, rateLimit);
    } catch (error) {
        console.error('Save location error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}






