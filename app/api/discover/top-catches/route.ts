import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const topCatches = await prisma.catch.findMany({
      where: {
        isPublic: true,
        createdAt: { gte: oneWeekAgo },
      },
      take: 20,
      include: {
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
      },
      orderBy: [
        { likes: { _count: 'desc' } },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(topCatches);
  } catch (error) {
    console.error('Top catches error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


