import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { createCommentSchema, updateCommentSchema, validateBody, formatZodError } from '@/lib/validations';
import { checkRateLimit, rateLimitResponse, COMMENT_LIMIT, addRateLimitHeaders } from '@/lib/rate-limit';
import { createCatchNotification, removeCommentNotification } from '@/lib/create-notification';

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export const dynamic = 'force-dynamic';

// POST - Create a comment
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        
        // Verify authentication
        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        
        const { userId } = auth;

        // Rate limiting
        const rateLimit = checkRateLimit(userId, COMMENT_LIMIT);
        if (!rateLimit.success) {
            return rateLimitResponse(rateLimit);
        }

        const body = await request.json();
        
        // Validate input
        const validation = validateBody(createCommentSchema, body);
        if (!validation.success) {
            return NextResponse.json({ error: formatZodError(validation.error) }, { status: 400 });
        }
        
        const { content } = validation.data;

        // Check if catch exists
        const catchData = await prisma.catch.findUnique({
            where: { id },
            select: { id: true, userId: true },
        });

        if (!catchData) {
            return NextResponse.json({ error: 'Catch not found' }, { status: 404 });
        }

        // Create comment
        const comment = await prisma.comment.create({
            data: {
                userId,
                catchId: id,
                content: content.trim(),
            },
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

        const response = NextResponse.json(comment, { status: 201 });
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

        const comments = await prisma.comment.findMany({
            where: { catchId: id },
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
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        return NextResponse.json(comments);
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
        
        // Verify authentication
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

        // Check if comment exists and belongs to user
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

        // Delete the comment
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
        
        // Verify authentication
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
        
        // Validate content
        const validation = validateBody(updateCommentSchema, body);
        if (!validation.success) {
            return NextResponse.json({ error: formatZodError(validation.error) }, { status: 400 });
        }
        
        const { content } = validation.data;

        // Check if comment exists and belongs to user
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

        // Update the comment
        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { content: content.trim() },
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
            },
        });

        return NextResponse.json(updatedComment);
    } catch (error) {
        console.error('Update comment error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

