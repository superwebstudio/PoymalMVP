import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Check if user has a pinned catch (excluding the current catch if provided)
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { userId } = auth;

        // Find existing pinned catch (excluding the current catch if it's already pinned)
        const existingPinned = await prisma.catch.findFirst({
            where: {
                userId,
                isPinned: true,
                id: { not: id }, // Exclude the current catch
            },
            select: {
                id: true,
            },
        });

        return NextResponse.json({
            hasPinned: !!existingPinned,
            pinnedCatchId: existingPinned?.id || null,
        });
    } catch (error) {
        console.error('Check pinned catch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - Pin/Unpin a catch to profile
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { userId } = auth;
        const body = await request.json().catch(() => ({}));
        const { replace = false } = body;

        // Check if catch exists and belongs to user
        const catchData = await prisma.catch.findUnique({
            where: { id },
            select: { userId: true, isPinned: true },
        });

        if (!catchData) {
            return NextResponse.json({ error: 'Catch not found' }, { status: 404 });
        }

        if (catchData.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // If pinning (not unpinning), check for existing pinned catch
        if (!catchData.isPinned && replace) {
            // Unpin any existing pinned catch
            await prisma.catch.updateMany({
                where: {
                    userId,
                    isPinned: true,
                    id: { not: id }, // Don't unpin the catch we're about to pin
                },
                data: {
                    isPinned: false,
                },
            });
        }

        // Toggle the pin status
        const updatedCatch = await prisma.catch.update({
            where: { id },
            data: {
                isPinned: !catchData.isPinned,
            },
        });

        return NextResponse.json(updatedCatch);
    } catch (error) {
        console.error('Pin catch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

