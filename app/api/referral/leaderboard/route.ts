import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Get referral leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const leaderboard = await prisma.user.findMany({
      where: {
        totalCompletedReferrals: { gt: 0 },
      },
      select: {
        id: true,
        firstName: true,
        username: true,
        photoUrl: true,
        totalCompletedReferrals: true,
        raffleTickets: true,
      },
      orderBy: {
        totalCompletedReferrals: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      leaderboard: leaderboard.map((user, index) => ({
        rank: index + 1,
        id: user.id,
        name: user.firstName || user.username || 'Angler',
        username: user.username,
        photoUrl: user.photoUrl,
        referrals: user.totalCompletedReferrals,
        raffleTickets: user.raffleTickets,
      })),
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

