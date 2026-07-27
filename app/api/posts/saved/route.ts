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

    const savedPosts = await prisma.savedPost.findMany({
      where: { userId },
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
      posts: savedPosts.map((sp) => ({
        id: sp.catch.id,
        userId: sp.catch.userId,
        imageUrl: sp.catch.imageUrl,
        species: sp.catch.species,
        scientificName: sp.catch.scientificName,
        description: sp.catch.description,
        weight: sp.catch.weight,
        length: sp.catch.length,
        location: sp.catch.location,
        latitude: sp.catch.latitude,
        longitude: sp.catch.longitude,
        isPublic: sp.catch.isPublic,
        locationPrivate: sp.catch.locationPrivate,
        isTextOnly: sp.catch.isTextOnly,
        createdAt: sp.catch.createdAt,
        user: sp.catch.user,
        likesCount: sp.catch._count.reactions,
        commentsCount: sp.catch._count.comments,
        savedAt: sp.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get saved posts error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
