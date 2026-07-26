import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const include = {
      user: {
        select: {
          id: true,
          firstName: true,
          username: true,
          photoUrl: true,
          isPro: true,
        },
      },
      _count: {
        select: { likes: true },
      },
    } as const;

    let topCatches = await prisma.catch.findMany({
      where: {
        isPublic: true,
        createdAt: { gte: oneWeekAgo },
      },
      take: 20,
      include,
      orderBy: [
        { likes: { _count: 'desc' } },
        { createdAt: 'desc' },
      ],
    });

    // Fallback for empty weeks / fresh DBs — still show recent public catches
    if (topCatches.length === 0) {
      topCatches = await prisma.catch.findMany({
        where: { isPublic: true },
        take: 20,
        include,
        orderBy: [
          { likes: { _count: 'desc' } },
          { createdAt: 'desc' },
        ],
      });
    }

    return NextResponse.json(topCatches);
  } catch (error) {
    console.error('Top catches error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


