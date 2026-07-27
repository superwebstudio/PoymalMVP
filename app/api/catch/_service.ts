import prisma from '@/lib/prisma';

export async function getCatch(id: string) {
    try {
        const catchData = await prisma.catch.findUnique({
            where: { id },
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
                reactions: {
                    select: {
                        emoji: true,
                        userId: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                        views: true,
                    },
                },
            },
        });

        if (!catchData) return null;

        return catchData;
    } catch (error) {
        console.error('Get catch error:', error);
        return null;
    }
}

export async function getRelatedCatches(
    id: string,
    userId: string,
    createdAt: Date | string,
    location?: string | null,
) {
    try {
        const catchDate = new Date(createdAt);
        const timeWindowStart = new Date(catchDate.getTime() - 5000);
        const timeWindowEnd = new Date(catchDate.getTime() + 5000);

        const where: {
            userId: string;
            createdAt: { gte: Date; lte: Date };
            isTextOnly: boolean;
            id: { not: string };
            location?: string;
        } = {
            userId,
            createdAt: {
                gte: timeWindowStart,
                lte: timeWindowEnd,
            },
            isTextOnly: false,
            id: { not: id },
        };

        if (location) {
            where.location = location;
        }

        return await prisma.catch.findMany({
            where,
            select: {
                id: true,
                species: true,
                scientificName: true,
                imageUrl: true,
                weight: true,
                length: true,
                description: true,
                location: true,
                latitude: true,
                longitude: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    } catch (error) {
        console.error('Error fetching related catches:', error);
        return [];
    }
}
