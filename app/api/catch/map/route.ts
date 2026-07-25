import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get catches with location data for map
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    const userId = auth.success ? auth.userId : undefined;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'hotspots'; // 'hotspots' | 'my-spots' | 'explore'
    const species = searchParams.get('species');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const minLat = searchParams.get('minLat');
    const maxLat = searchParams.get('maxLat');
    const minLng = searchParams.get('minLng');
    const maxLng = searchParams.get('maxLng');

    const isMyCatchesMode = mode === 'my-spots';

    if (isMyCatchesMode && !userId) {
      return NextResponse.json(
        { error: 'Authentication required', catches: [], total: 0 },
        { status: 401 }
      );
    }

    const where: Prisma.CatchWhereInput = {
      latitude: { not: null },
      longitude: { not: null },
      isTextOnly: false,
    };

    if (isMyCatchesMode) {
      // My Catches: only the signed-in user's catches with coordinates
      where.userId = userId;
    } else {
      // Community views: only public catches with public locations
      where.isPublic = true;
      where.locationPrivate = false;

      if (mode === 'hotspots' && userId) {
        where.userId = { not: userId };
      }
    }

    if (species) {
      where.species = species;
    }

    // Viewport filter — skip for My Catches so the full logbook can load and fit bounds
    if (!isMyCatchesMode && minLat && maxLat && minLng && maxLng) {
      where.latitude = {
        gte: parseFloat(minLat),
        lte: parseFloat(maxLat),
      };
      where.longitude = {
        gte: parseFloat(minLng),
        lte: parseFloat(maxLng),
      };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const hasSpeciesFilter = !!species;
    const hasBoundsFilter = !!(minLat && maxLat && minLng && maxLng);
    const resultLimit = isMyCatchesMode
      ? 500
      : hasSpeciesFilter || hasBoundsFilter
        ? 500
        : 200;

    const catches = await prisma.catch.findMany({
      where,
      select: {
        id: true,
        latitude: true,
        longitude: true,
        species: true,
        imageUrl: true,
        weight: true,
        length: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            username: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: resultLimit,
    });

    return NextResponse.json({
      catches,
      total: catches.length,
      limit: resultLimit,
    });
  } catch (error) {
    console.error('Error fetching map catches:', error);
    return NextResponse.json({ error: 'Failed to fetch catches' }, { status: 500 });
  }
}
