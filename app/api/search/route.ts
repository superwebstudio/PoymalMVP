import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import {
  STANDARD_LIMIT,
  addRateLimitHeaders,
  checkRateLimit,
  rateLimitResponse,
} from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

type SearchType = 'all' | 'people' | 'catches' | 'baits';

type SearchUser = {
  id: string;
  firstName: string | null;
  username: string | null;
  photoUrl: string | null;
  isPro: boolean;
  isFollowing: boolean;
  _count: {
    catches: number;
    followers: number;
  };
};

type SearchCatch = {
  id: string;
  species: string | null;
  description: string | null;
  imageUrl: string | null;
  location: string | null;
  weight: number | null;
  bait: string | null;
  method: string | null;
  postType: string | null;
  baitMixData: Prisma.JsonValue | null;
  user: {
    id: string;
    firstName: string | null;
    username: string | null;
    photoUrl: string | null;
    isPro: boolean;
  };
};

function parseSearchType(value: string | null): SearchType {
  if (value === 'people' || value === 'catches' || value === 'baits') {
    return value;
  }
  return 'all';
}

function baitMixTitle(data: Prisma.JsonValue | null): string | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const mixName = (data as Record<string, unknown>).mixName;
  return typeof mixName === 'string' && mixName.trim() ? mixName.trim() : null;
}

function matchesBaitQuery(row: SearchCatch, queryLower: string): boolean {
  const title = baitMixTitle(row.baitMixData);
  if (title?.toLowerCase().includes(queryLower)) return true;
  if (row.description?.toLowerCase().includes(queryLower)) return true;
  if (row.location?.toLowerCase().includes(queryLower)) return true;
  if (row.bait?.toLowerCase().includes(queryLower)) return true;
  return false;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await verifyAuth(req);
    const viewerId = auth.success ? auth.userId : null;

    const rateKey = viewerId
      ? `${viewerId}:search`
      : `anon-search:${req.headers.get('x-forwarded-for') || 'local'}`;
    const rateLimit = checkRateLimit(rateKey, STANDARD_LIMIT);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').trim();
    const type = parseSearchType(searchParams.get('type'));

    if (query.length < 2) {
      const response = NextResponse.json({
        people: [],
        catches: [],
        baits: [],
      });
      return addRateLimitHeaders(response, rateLimit);
    }

    const take = type === 'all' ? 12 : 20;
    const includePeople = type === 'all' || type === 'people';
    const includeCatches = type === 'all' || type === 'catches';
    const includeBaits = type === 'all' || type === 'baits';

    const textFilter: Prisma.StringFilter = {
      contains: query,
      mode: 'insensitive',
    };

    const queryLower = query.toLowerCase();

    const [peopleRaw, catchesRaw, baitCandidates] = await Promise.all([
      includePeople && viewerId
        ? prisma.user.findMany({
            where: {
              id: { not: viewerId },
              username: { not: null },
              OR: [{ firstName: textFilter }, { username: textFilter }],
            },
            take,
            select: {
              id: true,
              firstName: true,
              username: true,
              photoUrl: true,
              isPro: true,
              _count: {
                select: {
                  catches: true,
                  followers: true,
                },
              },
            },
            orderBy: { username: 'asc' },
          })
        : Promise.resolve([]),
      includeCatches
        ? prisma.catch.findMany({
            where: {
              isPublic: true,
              OR: [{ postType: null }, { postType: { not: 'bait_mix' } }],
              AND: [
                {
                  OR: [
                    { species: textFilter },
                    { location: textFilter },
                    { description: textFilter },
                    { bait: textFilter },
                    { method: textFilter },
                  ],
                },
              ],
            },
            take,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              species: true,
              description: true,
              imageUrl: true,
              location: true,
              weight: true,
              bait: true,
              method: true,
              postType: true,
              baitMixData: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  username: true,
                  photoUrl: true,
                  isPro: true,
                },
              },
            },
          })
        : Promise.resolve([]),
      includeBaits
        ? prisma.catch.findMany({
            where: {
              isPublic: true,
              postType: 'bait_mix',
            },
            take: Math.min(take * 8, 80),
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              species: true,
              description: true,
              imageUrl: true,
              location: true,
              weight: true,
              bait: true,
              method: true,
              postType: true,
              baitMixData: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  username: true,
                  photoUrl: true,
                  isPro: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const baits = (baitCandidates as SearchCatch[])
      .filter((row) => matchesBaitQuery(row, queryLower))
      .slice(0, take);

    let people: SearchUser[] = [];
    if (viewerId && peopleRaw.length > 0) {
      const following = await prisma.follow.findMany({
        where: {
          followerId: viewerId,
          followingId: { in: peopleRaw.map((user) => user.id) },
        },
        select: { followingId: true },
      });
      const followingIds = new Set(following.map((row) => row.followingId));
      people = peopleRaw.map((user) => ({
        ...user,
        isFollowing: followingIds.has(user.id),
      }));
    }

    const response = NextResponse.json({
      people,
      catches: catchesRaw as SearchCatch[],
      baits,
    });
    return addRateLimitHeaders(response, rateLimit);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
