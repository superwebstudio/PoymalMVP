import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 100;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const speciesOnly = searchParams.get('speciesOnly') === 'true';
    const limitParam = Number.parseInt(searchParams.get('limit') || '', 10);
    const take = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), MAX_LIMIT)
      : DEFAULT_LIMIT;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const catches = await prisma.catch.findMany({
      where: {
        userId: id,
        isTextOnly: false,
        species: { not: null },
      },
      select: speciesOnly
        ? {
            species: true,
          }
        : {
            id: true,
            species: true,
            scientificName: true,
            imageUrl: true,
            weight: true,
            length: true,
            description: true,
            location: true,
            latitude: true,
            longitude: true,
            createdAt: true,
            isPublic: true,
            locationPrivate: true,
          },
      orderBy: {
        createdAt: 'desc',
      },
      take,
    });

    return NextResponse.json(catches);
  } catch (error) {
    console.error('Error fetching user catches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
