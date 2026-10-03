import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { createCommentSchema, updateCommentSchema, validateBody, formatZodError } from '@/lib/validations';
import { checkRateLimit, rateLimitResponse, COMMENT_LIMIT, addRateLimitHeaders } from '@/lib/rate-limit';
import { createCatchNotification, removeCommentNotification } from '@/lib/create-notification';

export const dynamic = 'force-dynamic';

const commentUserSelect = {
    id: true,
    firstName: true,
    username: true,
    photoUrl: true,
    isPro: true,
} as const;

async function mapCommentsWithLikes(
    comments: Array<{
        id: string;
        userId: string;
        catchId: string;
        parentId: string | null;
        content: string;
        createdAt: Date;
        user: {
            id: string;
            firstName: string | null;
            username: string | null;
            photoUrl: string | null;
            isPro: boolean;
        };
        _count: { likes: number };
    }>,
    viewerId: string | null,
) {
    let likedIds = new Set<string>();
    if (viewerId && comments.length > 0) {
        const likes = await prisma.commentLike.findMany({
            where: {
                userId: viewerId,
                commentId: { in: comments.map((c) => c.id) },
            },
            select: { commentId: true },
        });
        likedIds = new Set(likes.map((l) => l.commentId));
    }

    return comments.map((comment) => ({
        id: comment.id,
        userId: comment.userId,
        catchId: comment.catchId,
        parentId: comment.parentId,
        content: comment.content,
        createdAt: comment.createdAt,
        user: comment.user,
        likesCount: comment._count.likes,
        likedByMe: likedIds.has(comment.id),
    }));
}

// POST - Create a comment
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

        const { userId } = auth;

        const rateLimit = checkRateLimit(userId, COMMENT_LIMIT);
        if (!rateLimit.success) {
            return rateLimitResponse(rateLimit);
        }

        const body = await request.json();

        const validation = validateBody(createCommentSchema, body);
        if (!validation.success) {
            return NextResponse.json({ error: formatZodError(validation.error) }, { status: 400 });
        }

        const { content, parentId } = validation.data;

        const catchData = await prisma.catch.findUnique({
            where: { id },
            select: { id: true, userId: true },
        });

        if (!catchData) {
            return NextResponse.json({ error: 'Catch not found' }, { status: 404 });
        }

        let resolvedParentId: string | null = parentId ?? null;
        if (resolvedParentId) {
            const parent = await prisma.comment.findUnique({
                where: { id: resolvedParentId },
                select: { id: true, catchId: true, parentId: true },
            });
            if (!parent || parent.catchId !== id) {
                return NextResponse.json({ error: 'Parent comment not found' }, { status: 400 });
            }
            // Flatten nested replies to one level under the root parent
            if (parent.parentId) {
                resolvedParentId = parent.parentId;
            }
        }

        const comment = await prisma.comment.create({
            data: {
                userId,
                catchId: id,
                parentId: resolvedParentId,
                content: content.trim(),
            },
            include: {
                user: { select: commentUserSelect },
                _count: { select: { likes: true } },
            },
        });

        void createCatchNotification({
            recipientId: catchData.userId,
            actorId: userId,
            catchId: id,
            type: 'comment',
            commentId: comment.id,
            commentPreview: content.trim(),
        });

        const response = NextResponse.json(
            {
                ...comment,
                likesCount: 0,
                likedByMe: false,
            },
            { status: 201 },
        );
        return addRateLimitHeaders(response, rateLimit);
    } catch (error) {
        console.error('Comment error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// GET - Get comments for a catch
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const auth = await verifyAuth(request);
        const viewerId = auth.success ? auth.userId : null;

        const comments = await prisma.comment.findMany({
            where: { catchId: id },
            include: {
                user: { select: commentUserSelect },
                _count: { select: { likes: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json(await mapCommentsWithLikes(comments, viewerId));
    } catch (error) {
        console.error('Get comments error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE - Delete a comment
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const { userId } = auth;

        const { searchParams } = new URL(request.url);
        const commentId = searchParams.get('commentId');

        if (!commentId) {
            return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
        }

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { userId: true, catchId: true },
        });

        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }

        if (comment.catchId !== id) {
            return NextResponse.json({ error: 'Comment does not belong to this catch' }, { status: 400 });
        }

        if (comment.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.comment.delete({
            where: { id: commentId },
        });

        void removeCommentNotification({
            actorId: userId,
            catchId: id,
            commentId,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete comment error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH - Update a comment
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const { userId } = auth;

        const body = await request.json();
        const { commentId } = body;

        if (!commentId) {
            return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
        }

        const validation = validateBody(updateCommentSchema, body);
        if (!validation.success) {
            return NextResponse.json({ error: formatZodError(validation.error) }, { status: 400 });
        }

        const { content } = validation.data;

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { userId: true, catchId: true },
        });

        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }

        if (comment.catchId !== id) {
            return NextResponse.json({ error: 'Comment does not belong to this catch' }, { status: 400 });
        }

        if (comment.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { content: content.trim() },
            include: {
                user: { select: commentUserSelect },
                _count: { select: { likes: true } },
            },
        });

        const likedByMe = await prisma.commentLike.findUnique({
            where: {
                userId_commentId: { userId, commentId },
            },
            select: { id: true },
        });

        return NextResponse.json({
            ...updatedComment,
            likesCount: updatedComment._count.likes,
            likedByMe: Boolean(likedByMe),
        });
    } catch (error) {
        console.error('Update comment error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
