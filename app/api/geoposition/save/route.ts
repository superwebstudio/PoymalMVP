import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST - Save geoposition
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { userId } = auth;

    const body = await request.json();
    const { latitude, longitude, catchId } = body;

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    // Update catch with geoposition
    if (catchId) {
      await prisma.catch.update({
        where: { id: catchId, userId },
        data: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving geoposition:', error);
    return NextResponse.json({ error: 'Failed to save geoposition' }, { status: 500 });
  }
}



















