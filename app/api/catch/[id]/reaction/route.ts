import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { reactionSchema, validateBody, formatZodError } from '@/lib/validations';
import { checkRateLimit, rateLimitResponse, REACTION_LIMIT, addRateLimitHeaders } from '@/lib/rate-limit';
import { createCatchNotification } from '@/lib/create-notification';

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export const dynamic = 'force-dynamic';

// GET - Get reactions for a catch
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        // Try to get user for personalized response, but don't require auth
        const auth = await verifyAuth(request);
        const userId = auth.success ? auth.userId : null;

        const reactions = await prisma.reaction.findMany({
            where: { catchId: id },
            select: {
                emoji: true,
                userId: true,
            },
        });

        return NextResponse.json({
            reactions,
            hasLiked: userId ? reactions.some(r => r.userId === userId) : false,
            likesCount: reactions.length
        });
    } catch (error) {
        console.error('Get reactions error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - Add or update a reaction
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
        const rateLimit = checkRateLimit(userId, REACTION_LIMIT);
        if (!rateLimit.success) {
            return rateLimitResponse(rateLimit);
        }

        const body = await request.json();

        // Validate input
        const validation = validateBody(reactionSchema, body);
        if (!validation.success) {
            return NextResponse.json({ error: formatZodError(validation.error) }, { status: 400 });
        }

        const { emoji } = validation.data;

        // Check if catch exists
        const catchData = await prisma.catch.findUnique({
            where: { id },
            select: { id: true, userId: true },
        });

        if (!catchData) {
            return NextResponse.json({ error: 'Catch not found' }, { status: 404 });
        }

        // Check if user already has a reaction
        const existingReaction = await prisma.reaction.findUnique({
            where: {
                userId_catchId: {
                    userId,
                    catchId: id,
                },
            },
        });

        if (existingReaction) {
            if (existingReaction.emoji === emoji) {
                // Remove reaction if clicking the same emoji
                await prisma.reaction.delete({
                    where: {
                        userId_catchId: {
                            userId,
                            catchId: id,
                        },
                    },
                });
            } else {
                // Update reaction with new emoji
                await prisma.reaction.update({
                    where: {
                        userId_catchId: {
                            userId,
                            catchId: id,
                        },
                    },
                    data: {
                        emoji,
                    },
                });
            }
        } else {
            // Create new reaction
            await prisma.reaction.create({
                data: {
                    userId,
                    catchId: id,
                    emoji,
                },
            });

            void createCatchNotification({
                recipientId: catchData.userId,
                actorId: userId,
                catchId: id,
                type: 'like',
            });
        }

        // Fetch updated reactions
        const reactions = await prisma.reaction.findMany({
            where: { catchId: id },
            select: {
                emoji: true,
                userId: true,
            },
        });

        // Return computed values directly so client doesn't have to guess
        const response = NextResponse.json({
            reactions,
            hasLiked: reactions.some(r => r.userId === userId),
            likesCount: reactions.length
        });
        return addRateLimitHeaders(response, rateLimit);
    } catch (error) {
        console.error('Reaction error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

