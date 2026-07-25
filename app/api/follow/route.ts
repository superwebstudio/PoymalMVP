import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse, STANDARD_LIMIT } from '@/lib/rate-limit';
import { z } from 'zod';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const followSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['follow', 'unfollow']),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const followerId = searchParams.get('followerId');
    const followingId = searchParams.get('followingId');

    if (!followerId || !followingId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return NextResponse.json({ isFollowing: !!follow });
  } catch (error) {
    console.error('Follow check error:', error);
    return NextResponse.json({ isFollowing: false });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    
    const { userId: currentUserId } = auth;

    // Rate limiting
    const rateLimit = checkRateLimit(currentUserId, STANDARD_LIMIT);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const body = await req.json();
    
    // Validate input
    const validation = followSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    
    const { userId: targetUserId, action } = validation.data;

    // Prevent self-follow
    if (currentUserId === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    if (action === 'follow') {
      await prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      });
    } else if (action === 'unfollow') {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

