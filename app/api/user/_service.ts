import prisma from '@/lib/prisma';

export async function getUserProfile(id: string) {
    try {
        if (!id) return null;

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                catches: {
                    orderBy: [
                        { isPinned: 'desc' }, // Pinned posts first
                        { createdAt: 'desc' }, // Then by date
                    ],
                    include: {
                        _count: {
                            select: {
                                likes: true,
                                comments: true,
                                views: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) return null;

        // Fetch counts separately
        let followersCount = 0;
        let followingCount = 0;
        try {
            // @ts-ignore
            followersCount = await prisma.follow?.count({ where: { followingId: user.id } }) || 0;
            // @ts-ignore
            followingCount = await prisma.follow?.count({ where: { followerId: user.id } }) || 0;
        } catch (e) {
            // Follow model not available yet
        }

        // Group catches logic
        const groupedCatches: any[] = [];
        const processedIds = new Set<string>();

        for (const catchItem of user.catches) {
            if (processedIds.has(catchItem.id)) continue;

            const catchTime = new Date(catchItem.createdAt).getTime();
            const timeWindowStart = catchTime - 5000;
            const timeWindowEnd = catchTime + 5000;

            const related = user.catches.filter(c =>
                !processedIds.has(c.id) &&
                c.userId === catchItem.userId &&
                c.location === catchItem.location &&
                !c.isTextOnly &&
                new Date(c.createdAt).getTime() >= timeWindowStart &&
                new Date(c.createdAt).getTime() <= timeWindowEnd
            );

            if (related.length > 1) {
                const sortedRelated = related.sort((a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );

                const mainCatch = sortedRelated[0];
                const allImages = sortedRelated
                    .map(c => c.imageUrl)
                    .filter(Boolean) as string[];

                const totalLikes = sortedRelated.reduce((sum, c) => sum + (c._count?.likes || 0), 0);
                const totalComments = sortedRelated.reduce((sum, c) => sum + (c._count?.comments || 0), 0);
                const totalViews = sortedRelated.reduce((sum, c) => sum + (c._count?.views || 0), 0);
                const totalWeight = sortedRelated.reduce((sum, c) => sum + (c.weight || 0), 0);
                const maxLength = sortedRelated.reduce((max, c) => Math.max(max, c.length || 0), 0);

                // Fetch reactions
                const allReactions = await Promise.all(
                    sortedRelated.map(async (c) => {
                        try {
                            return await prisma.reaction.findMany({
                                where: { catchId: c.id },
                                select: { emoji: true, userId: true },
                            });
                        } catch (e) { return []; }
                    })
                );
                const reactions = allReactions.flat();

                groupedCatches.push({
                    ...mainCatch,
                    relatedCatches: sortedRelated.slice(1),
                    allImages: allImages.length > 0 ? allImages : [mainCatch.imageUrl].filter(Boolean),
                    weight: totalWeight || mainCatch.weight,
                    length: maxLength || mainCatch.length,
                    _count: {
                        likes: totalLikes,
                        comments: totalComments,
                        views: totalViews,
                    },
                    reactions,
                });

                related.forEach(c => processedIds.add(c.id));
            } else {
                let reactions: any[] = [];
                try {
                    reactions = await prisma.reaction.findMany({
                        where: { catchId: catchItem.id },
                        select: { emoji: true, userId: true },
                    });
                } catch (e) { reactions = []; }

                groupedCatches.push({
                    ...catchItem,
                    allImages: catchItem.imageUrl ? [catchItem.imageUrl] : [],
                    reactions,
                });
                processedIds.add(catchItem.id);
            }
        }

        return {
            ...user,
            catches: groupedCatches,
            _count: {
                followers: followersCount,
                following: followingCount,
            },
        };
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}
