import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
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
        const body = await request.json();

        const savedLocation = await prisma.savedLocation.findUnique({
            where: { id },
        });

        if (!savedLocation) {
            return NextResponse.json({ error: 'Location not found' }, { status: 404 });
        }

        if (savedLocation.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updated = await prisma.savedLocation.update({
            where: { id },
            data: {
                name: body.name || null,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Update saved location error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
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

        const savedLocation = await prisma.savedLocation.findUnique({
            where: { id },
        });

        if (!savedLocation) {
            return NextResponse.json({ error: 'Location not found' }, { status: 404 });
        }

        if (savedLocation.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.savedLocation.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete saved location error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        }, { status: 500 });
    }
}

