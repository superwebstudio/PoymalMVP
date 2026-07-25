import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({});
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        country: true,
        language: true,
      },
    });

    return NextResponse.json(currentUser || {});
  } catch (error) {
    console.error('Current user error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


