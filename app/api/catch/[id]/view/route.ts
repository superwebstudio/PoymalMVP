import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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

    const catchData = await prisma.catch.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!catchData) {
      return NextResponse.json({ error: 'Catch not found' }, { status: 404 });
    }

    await prisma.catchView.upsert({
      where: {
        catchId_userId: {
          catchId: id,
          userId: auth.userId,
        },
      },
      create: {
        catchId: id,
        userId: auth.userId,
      },
      update: {},
    });

    const viewCount = await prisma.catchView.count({
      where: { catchId: id },
    });

    return NextResponse.json({ viewCount });
  } catch (error) {
    console.error('Record catch view error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
