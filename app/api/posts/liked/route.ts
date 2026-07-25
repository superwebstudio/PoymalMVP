import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get user's liked posts
export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { userId } = auth;

        // Get posts liked by user (using Reaction model with ❤️ emoji)
        const reactions = await prisma.reaction.findMany({
            where: {
                userId,
                emoji: '❤️', // Only heart reactions count as "likes"
            },
            include: {
                catch: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                username: true,
                                photoUrl: true,
                                isPro: true,
                                country: true,
                            },
                        },
                        reactions: {
                            where: {
                                emoji: '❤️',
                            },
                        },
                        _count: {
                            select: {
                                comments: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({
            posts: reactions.map((reaction) => ({
                id: reaction.catch.id,
                userId: reaction.catch.userId,
                imageUrl: reaction.catch.imageUrl,
                species: reaction.catch.species,
                scientificName: reaction.catch.scientificName,
                description: reaction.catch.description,
                weight: reaction.catch.weight,
                length: reaction.catch.length,
                location: reaction.catch.location,
                latitude: reaction.catch.latitude,
                longitude: reaction.catch.longitude,
                isPublic: reaction.catch.isPublic,
                locationPrivate: reaction.catch.locationPrivate,
                isTextOnly: reaction.catch.isTextOnly,
                createdAt: reaction.catch.createdAt,
                user: reaction.catch.user,
                likesCount: reaction.catch.reactions?.length || 0, // Count only heart reactions for this catch
                commentsCount: reaction.catch._count.comments,
                likedAt: reaction.createdAt,
            })),
        });
    } catch (error) {
        console.error('Get liked posts error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

