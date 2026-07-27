import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type FollowType = 'followers' | 'following';

type LeanUser = {
  id: string;
  firstName: string | null;
  username: string | null;
  photoUrl: string | null;
  isPro: boolean;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id: userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get('type');
    const type: FollowType =
      typeParam === 'following' ? 'following' : 'followers';
    const cursor = searchParams.get('cursor');
    const takeRaw = Number.parseInt(searchParams.get('take') || '40', 10);
    const take = Number.isFinite(takeRaw)
      ? Math.min(Math.max(takeRaw, 1), 50)
      : 40;

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!userExists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const follows = await prisma.follow.findMany({
      where:
        type === 'followers'
          ? { followingId: userId }
          : { followerId: userId },
      orderBy: { createdAt: 'desc' },
      take,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      select: {
        id: true,
        follower:
          type === 'followers'
            ? {
                select: {
                  id: true,
                  firstName: true,
                  username: true,
                  photoUrl: true,
                  isPro: true,
                },
              }
            : false,
        following:
          type === 'following'
            ? {
                select: {
                  id: true,
                  firstName: true,
                  username: true,
                  photoUrl: true,
                  isPro: true,
                },
              }
            : false,
      },
    });

    const users: LeanUser[] = follows
      .map((row) =>
        type === 'followers'
          ? (row.follower as LeanUser | null)
          : (row.following as LeanUser | null),
      )
      .filter((user): user is LeanUser => user !== null);

    let viewerId: string | null = null;
    const auth = await verifyAuth(req);
    if (auth.success) {
      viewerId = auth.userId;
    }

    let followingIds = new Set<string>();
    if (viewerId && users.length > 0) {
      const following = await prisma.follow.findMany({
        where: {
          followerId: viewerId,
          followingId: { in: users.map((u) => u.id) },
        },
        select: { followingId: true },
      });
      followingIds = new Set(following.map((row) => row.followingId));
    }

    const results = users.map((user) => ({
      ...user,
      isFollowing: viewerId ? followingIds.has(user.id) : false,
    }));

    const nextCursor =
      follows.length === take ? follows[follows.length - 1]?.id ?? null : null;

    return NextResponse.json({
      type,
      users: results,
      nextCursor,
    });
  } catch (error) {
    console.error('Follows list error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
