import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const LIST_LIMIT = 50;

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { userId } = auth;

    const reactions = await prisma.reaction.findMany({
      where: {
        userId,
        emoji: '❤️',
      },
      take: LIST_LIMIT,
      include: {
        catch: {
          select: {
            id: true,
            userId: true,
            imageUrl: true,
            species: true,
            scientificName: true,
            description: true,
            weight: true,
            length: true,
            location: true,
            latitude: true,
            longitude: true,
            isPublic: true,
            locationPrivate: true,
            isTextOnly: true,
            createdAt: true,
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
            _count: {
              select: {
                comments: true,
                reactions: true,
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
        likesCount: reaction.catch._count.reactions,
        commentsCount: reaction.catch._count.comments,
        likedAt: reaction.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get liked posts error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
