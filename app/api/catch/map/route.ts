import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import {
  canUseAdvancedMapFilters,
  canViewCommunityExactCoords,
  fuzzCoordinate,
  getAccessTier,
} from '@/lib/access-tier';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await verifyAuth(request);
    const userId = auth.success ? auth.userId : undefined;

    let isPro = false;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isPro: true },
      });
      isPro = user?.isPro ?? false;
    }

    const tier = getAccessTier(userId ? { id: userId, isPro } : null);
    const exactCommunity = canViewCommunityExactCoords(tier);
    const advancedFilters = canUseAdvancedMapFilters(tier);

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'hotspots';
    const species = advancedFilters ? searchParams.get('species') : null;
    const dateFrom = advancedFilters ? searchParams.get('dateFrom') : null;
    const dateTo = advancedFilters ? searchParams.get('dateTo') : null;

    const minLat = searchParams.get('minLat');
    const maxLat = searchParams.get('maxLat');
    const minLng = searchParams.get('minLng');
    const maxLng = searchParams.get('maxLng');

    const isMyCatchesMode = mode === 'my-spots';

    if (isMyCatchesMode && !userId) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          catches: [],
          total: 0,
          locationMode: 'heatmap' as const,
        },
        { status: 401 },
      );
    }

    const where: Prisma.CatchWhereInput = {
      latitude: { not: null },
      longitude: { not: null },
      isTextOnly: false,
    };

    if (isMyCatchesMode) {
      where.userId = userId;
    } else {
      where.isPublic = true;
      where.locationPrivate = false;

      if (mode === 'hotspots' && userId) {
        where.userId = { not: userId };
      }
    }

    if (species) {
      where.species = species;
    }

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
        userId: true,
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

    // PRO and the catch owner receive exact coordinates. Everyone else gets
    // coordinates snapped to a coarse grid so community spots stay approximate.
    const locationMode =
      isMyCatchesMode || exactCommunity ? ('exact' as const) : ('heatmap' as const);

    const sanitized = catches.map((item) => {
      const isOwn = !!userId && item.userId === userId;
      const showExact = isMyCatchesMode || isOwn || exactCommunity;

      if (showExact) {
        return {
          id: item.id,
          latitude: item.latitude,
          longitude: item.longitude,
          species: item.species,
          imageUrl: item.imageUrl,
          weight: item.weight,
          length: item.length,
          createdAt: item.createdAt,
          user: item.user,
          _count: item._count,
        };
      }

      return {
        id: item.id,
        latitude: item.latitude != null ? fuzzCoordinate(item.latitude) : null,
        longitude: item.longitude != null ? fuzzCoordinate(item.longitude) : null,
        species: item.species,
        imageUrl: null,
        weight: null,
        length: null,
        createdAt: item.createdAt,
        user: {
          id: item.user.id,
          firstName: null,
          username: null,
        },
        _count: item._count,
      };
    });

    return NextResponse.json({
      catches: sanitized,
      total: sanitized.length,
      limit: resultLimit,
      locationMode,
      tier,
    });
  } catch (error) {
    console.error('Error fetching map catches:', error);
    return NextResponse.json({ error: 'Failed to fetch catches' }, { status: 500 });
  }
}
