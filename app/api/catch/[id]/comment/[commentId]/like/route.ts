import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse, REACTION_LIMIT, addRateLimitHeaders } from '@/lib/rate-limit';
import { createCatchNotification, removeCommentLikeNotification } from '@/lib/create-notification';

export const dynamic = 'force-dynamic';

// POST - Toggle like on a comment
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> },
): Promise<NextResponse> {
  try {
    const { id: catchId, commentId } = await context.params;

    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId } = auth;

    const rateLimit = checkRateLimit(userId, REACTION_LIMIT);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, catchId: true, userId: true },
    });

    if (!comment || comment.catchId !== catchId) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const existing = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: { userId, commentId },
      },
    });

    if (existing) {
      await prisma.commentLike.delete({
        where: { id: existing.id },
      });
      void removeCommentLikeNotification({
        actorId: userId,
        catchId,
        commentId,
      });
    } else {
      await prisma.commentLike.create({
        data: { userId, commentId },
      });
      void createCatchNotification({
        recipientId: comment.userId,
        actorId: userId,
        catchId,
        type: 'comment_like',
        commentId,
      });
    }

    const likesCount = await prisma.commentLike.count({
      where: { commentId },
    });

    const response = NextResponse.json({
      likedByMe: !existing,
      likesCount,
    });
    return addRateLimitHeaders(response, rateLimit);
  } catch (error) {
    console.error('Comment like error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
