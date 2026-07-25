import prisma from '@/lib/prisma';

export async function getFeed(userId?: string, type: 'all' | 'following' = 'all') {
    try {
        // Get list of users the current user follows (if logged in)
        let followingIds: string[] = [];
        if (userId) {
            const following = await prisma.follow.findMany({
                where: {
                    followerId: userId,
                },
                select: {
                    followingId: true,
                },
            });
            followingIds = following.map(f => f.followingId);
        }

        // Build where clause based on feed type
        const whereClause: any = {
            isPublic: true,
        };

        // If feed type is 'following', only show catches from users the current user follows
        if (type === 'following') {
            if (followingIds.length === 0) {
                // User is not following anyone, return empty array
                return [];
            }
            whereClause.userId = {
                in: followingIds,
            };
        }

        // Get catches based on feed type
        const allCatches = await prisma.catch.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc',
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
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        });

        // If user is logged in and feed type is 'all', find posts where someone they follow has commented
        let surfacedFromReplies: any[] = [];
        if (userId && type === 'all' && followingIds.length > 0) {
            // Find catches that have comments from users the current user follows
            const catchesWithFollowedComments = await prisma.catch.findMany({
                where: {
                    isPublic: true,
                    comments: {
                        some: {
                            userId: {
                                in: followingIds,
                            },
                        },
                    },
                    // Exclude catches from users they already follow (those would be in regular feed)
                    userId: {
                        notIn: followingIds,
                    },
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
                    comments: {
                        where: {
                            userId: {
                                in: followingIds,
                            },
                        },
                        orderBy: {
                            createdAt: 'desc',
                        },
                        take: 1,
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    username: true,
                                    photoUrl: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 10,
            });

            // Mark these as surfaced from replies
            surfacedFromReplies = catchesWithFollowedComments.map(catchItem => ({
                ...catchItem,
                surfacedFromReply: true,
                replyFrom: catchItem.comments[0]?.user,
                replyComment: catchItem.comments[0],
            }));
        }

        // Group catches that were posted together (same user, same time window, same location)
        // These are multiple fish entries from the same fishing trip
        const groupedCatches: any[] = [];
        const processedIds = new Set<string>();

        for (const catchItem of allCatches) {
            if (processedIds.has(catchItem.id)) continue;

            // Find related catches (same user, same time window ±5 seconds, same location)
            const catchTime = new Date(catchItem.createdAt).getTime();
            const timeWindowStart = catchTime - 5000; // 5 seconds before
            const timeWindowEnd = catchTime + 5000; // 5 seconds after

            const related = allCatches.filter(c =>
                !processedIds.has(c.id) &&
                c.userId === catchItem.userId &&
                c.location === catchItem.location &&
                !c.isTextOnly &&
                new Date(c.createdAt).getTime() >= timeWindowStart &&
                new Date(c.createdAt).getTime() <= timeWindowEnd
            );

            if (related.length > 1) {
                // Group multiple catches together
                const sortedRelated = related.sort((a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );

                // Use the first catch as the main post, but include all images
                const mainCatch = sortedRelated[0];
                const allImages = sortedRelated
                    .map(c => c.imageUrl)
                    .filter(Boolean) as string[];

                // Aggregate likes, comments, and stats from all related catches
                const totalLikes = sortedRelated.reduce((sum, c) => sum + (c._count?.likes || 0), 0);
                const totalComments = sortedRelated.reduce((sum, c) => sum + (c._count?.comments || 0), 0);
                const totalWeight = sortedRelated.reduce((sum, c) => sum + (c.weight || 0), 0);
                const maxLength = sortedRelated.reduce((max, c) => Math.max(max, c.length || 0), 0);

                groupedCatches.push({
                    ...mainCatch,
                    relatedCatches: sortedRelated.slice(1),
                    allImages: allImages.length > 0 ? allImages : [mainCatch.imageUrl].filter(Boolean),
                    weight: totalWeight || mainCatch.weight,
                    length: maxLength || mainCatch.length,
                    _count: {
                        likes: totalLikes,
                        comments: totalComments,
                    },
                });

                related.forEach(c => processedIds.add(c.id));
            } else {
                // Single catch, add as-is
                groupedCatches.push({
                    ...catchItem,
                    allImages: catchItem.imageUrl ? [catchItem.imageUrl] : [],
                });
                processedIds.add(catchItem.id);
            }
        }

        // Combine regular feed with surfaced posts
        // Remove duplicates (if a post is both in regular feed and surfaced, keep the surfaced version)
        const regularCatches = groupedCatches.slice(0, 20);
        const surfacedCatchIds = new Set(surfacedFromReplies.map(c => c.id));
        const uniqueRegularCatches = regularCatches.filter(c => !surfacedCatchIds.has(c.id));

        // Combine: surfaced posts first (more relevant), then regular feed
        const combinedCatches = [...surfacedFromReplies, ...uniqueRegularCatches].slice(0, 30);

        // Fetch reactions and saved status separately for each catch (or group of catches)
        const catchesWithReactions = await Promise.all(
            combinedCatches.map(async (catchItem) => {
                let reactions: any[] = [];
                let isSaved = false;
                
                try {
                    // If this is a grouped catch, fetch reactions from all related catches
                    if (catchItem.relatedCatches && catchItem.relatedCatches.length > 0) {
                        const allCatchIds = [catchItem.id, ...catchItem.relatedCatches.map((c: any) => c.id)];
                        reactions = await prisma.reaction.findMany({
                            where: { catchId: { in: allCatchIds } },
                            select: {
                                emoji: true,
                                userId: true,
                            },
                        });
                    } else {
                        reactions = await prisma.reaction.findMany({
                            where: { catchId: catchItem.id },
                            select: {
                                emoji: true,
                                userId: true,
                            },
                        });
                    }
                    
                    // Check if post is saved by current user (if logged in)
                    if (userId) {
                        try {
                            const savedPost = await prisma.savedPost.findUnique({
                                where: {
                                    userId_catchId: {
                                        userId,
                                        catchId: catchItem.id,
                                    },
                                },
                            });
                            isSaved = !!savedPost;
                        } catch (e) {
                            // SavedPost model might not exist, ignore
                        }
                    }
                } catch (e) {
                    reactions = [];
                }
                
                return {
                    ...catchItem,
                    likesCount: catchItem._count?.likes || 0,
                    reactions,
                    isSaved, // Include saved status in feed response
                };
            })
        );

        return catchesWithReactions;
    } catch (error) {
        console.error('Feed fetch error:', error);
        return [];
    }
}
