import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'total';

    let leaderboard: any[] = [];

    if (category === 'total') {
      // Total weight leaderboard
      const users = await prisma.user.findMany({
        include: {
          catches: {
            select: { weight: true },
          },
          _count: {
            select: {
              catches: true,
            },
          },
        },
      });

      leaderboard = await Promise.all(
        users.map(async (user) => {
          let followersCount = 0;
          try {
            // @ts-ignore - Follow model may not exist in every environment
            followersCount = (await prisma.follow?.count({ where: { followingId: user.id } })) || 0;
          } catch (error) {
            followersCount = 0;
          }

          const totalWeight = user.catches.reduce((sum, c) => sum + (c.weight || 0), 0);

          return {
            ...user,
            totalWeight,
            _count: {
              ...user._count,
              followers: followersCount,
            },
          };
        })
      );

      leaderboard = leaderboard
        .sort((a, b) => b.totalWeight - a.totalWeight)
        .slice(0, 50);
    } else if (category === 'species') {
      // Most species caught
      const users = await prisma.user.findMany({
        include: {
          catches: {
            select: { species: true },
          },
        },
      });

      leaderboard = users
        .map((user) => {
          const uniqueSpecies = new Set(user.catches.map(c => c.species).filter(Boolean));
          return {
            ...user,
            score: uniqueSpecies.size,
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);
    } else if (category === 'streak') {
      // Placeholder for streak (would need proper implementation)
      leaderboard = [];
    } else if (category === 'following') {
      // Following-only leaderboard (placeholder - needs current user)
      leaderboard = [];
    } else if (category === 'country') {
      // By country
      const country = searchParams.get('country');
      if (country) {
        const users = await prisma.user.findMany({
          where: {
            country: country,
          },
          include: {
            catches: {
              select: { weight: true },
            },
          },
        });

        leaderboard = users
          .map((user) => ({
            ...user,
            score: user.catches.reduce((sum, c) => sum + (c.weight || 0), 0).toFixed(1),
          }))
          .sort((a, b) => parseFloat(b.score) - parseFloat(a.score))
          .slice(0, 50);
      } else {
        leaderboard = [];
      }
    }

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

