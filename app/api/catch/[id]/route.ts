import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// DELETE - Delete a catch
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

        // Check if catch exists and belongs to user
        const catchData = await prisma.catch.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!catchData) {
            return NextResponse.json({ error: 'Catch not found' }, { status: 404 });
        }

        if (catchData.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Clear dependent rows that would block delete (reposts point at this catch without Cascade)
        await prisma.$transaction([
            prisma.catch.updateMany({
                where: { originalPostId: id },
                data: { originalPostId: null },
            }),
            prisma.notification.deleteMany({
                where: { catchId: id },
            }),
            prisma.catch.delete({
                where: { id },
            }),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete catch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH - Update a catch
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

        // Check if catch exists and belongs to user
        const catchData = await prisma.catch.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!catchData) {
            return NextResponse.json({ error: 'Catch not found' }, { status: 404 });
        }

        if (catchData.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update the catch
        const updateData: Prisma.CatchUpdateInput = {
            imageUrl: body.imageUrl !== undefined ? body.imageUrl : undefined,
            species: body.species !== undefined ? body.species : undefined,
            scientificName: body.scientificName !== undefined ? body.scientificName : undefined,
            description: body.description !== undefined ? body.description : undefined,
            weight: body.weight !== undefined ? (body.weight ? parseFloat(body.weight) : null) : undefined,
            length: body.length !== undefined ? (body.length ? parseFloat(body.length) : null) : undefined,
            location: body.location !== undefined ? body.location : undefined,
            depth: body.depth !== undefined ? (body.depth ? parseFloat(body.depth) : null) : undefined,
            waterTemp: body.waterTemp !== undefined ? (body.waterTemp ? parseFloat(body.waterTemp) : null) : undefined,
            bait: body.bait !== undefined ? body.bait : undefined,
            method: body.method !== undefined ? body.method : undefined,
            rating: body.rating !== undefined
                ? (body.rating === null || body.rating === ''
                    ? null
                    : (() => {
                        const n = parseInt(String(body.rating), 10);
                        return Number.isFinite(n) ? Math.min(5, Math.max(1, n)) : null;
                    })())
                : undefined,
            locationPrivate: body.locationPrivate !== undefined ? body.locationPrivate : undefined,
        };

        // Handle weatherData update
        if (body.weatherData !== undefined) {
            // If weatherData is explicitly null or empty object, clear it
            if (body.weatherData === null || (typeof body.weatherData === 'object' && Object.keys(body.weatherData).length === 0)) {
                updateData.weatherData = Prisma.JsonNull;
            } else {
                // Otherwise, update with the provided weather data
                updateData.weatherData = body.weatherData;
            }
        }

        const updatedCatch = await prisma.catch.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updatedCatch);
    } catch (error) {
        console.error('Update catch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

