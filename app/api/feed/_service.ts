import prisma from '@/lib/prisma';

type FeedCatch = {
  id: string;
  userId: string;
  relatedCatches?: Array<{ id: string }>;
  _count?: { likes?: number; comments?: number };
  [key: string]: unknown;
};

export async function getFeed(userId?: string, type: 'all' | 'following' = 'all') {
  try {
    let followingIds: string[] = [];
    if (userId) {
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      followingIds = following.map((f) => f.followingId);
    }

    const whereClause: {
      isPublic: boolean;
      userId?: { in: string[] };
    } = {
      isPublic: true,
    };

    if (type === 'following') {
      if (followingIds.length === 0) {
        return [];
      }
      whereClause.userId = { in: followingIds };
    }

    const allCatches = await prisma.catch.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 40,
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

    let surfacedFromReplies: FeedCatch[] = [];
    if (userId && type === 'all' && followingIds.length > 0) {
      const catchesWithFollowedComments = await prisma.catch.findMany({
        where: {
          isPublic: true,
          comments: {
            some: {
              userId: { in: followingIds },
            },
          },
          userId: { notIn: followingIds },
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
            where: { userId: { in: followingIds } },
            orderBy: { createdAt: 'desc' },
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
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      surfacedFromReplies = catchesWithFollowedComments.map((catchItem) => ({
        ...catchItem,
        surfacedFromReply: true,
        replyFrom: catchItem.comments[0]?.user,
        replyComment: catchItem.comments[0],
      }));
    }

    const groupedCatches: FeedCatch[] = [];
    const processedIds = new Set<string>();

    for (const catchItem of allCatches) {
      if (processedIds.has(catchItem.id)) continue;

      const catchTime = new Date(catchItem.createdAt).getTime();
      const timeWindowStart = catchTime - 5000;
      const timeWindowEnd = catchTime + 5000;

      const related = allCatches.filter(
        (c) =>
          !processedIds.has(c.id) &&
          c.userId === catchItem.userId &&
          c.location === catchItem.location &&
          !c.isTextOnly &&
          new Date(c.createdAt).getTime() >= timeWindowStart &&
          new Date(c.createdAt).getTime() <= timeWindowEnd,
      );

      if (related.length > 1) {
        const sortedRelated = related.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

        const mainCatch = sortedRelated[0];
        const allImages = sortedRelated
          .map((c) => c.imageUrl)
          .filter(Boolean) as string[];

        const totalLikes = sortedRelated.reduce(
          (sum, c) => sum + (c._count?.likes || 0),
          0,
        );
        const totalComments = sortedRelated.reduce(
          (sum, c) => sum + (c._count?.comments || 0),
          0,
        );
        const totalWeight = sortedRelated.reduce(
          (sum, c) => sum + (c.weight || 0),
          0,
        );
        const maxLength = sortedRelated.reduce(
          (max, c) => Math.max(max, c.length || 0),
          0,
        );

        groupedCatches.push({
          ...mainCatch,
          relatedCatches: sortedRelated.slice(1),
          allImages:
            allImages.length > 0
              ? allImages
              : [mainCatch.imageUrl].filter(Boolean),
          weight: totalWeight || mainCatch.weight,
          length: maxLength || mainCatch.length,
          _count: {
            likes: totalLikes,
            comments: totalComments,
          },
        });

        related.forEach((c) => processedIds.add(c.id));
      } else {
        groupedCatches.push({
          ...catchItem,
          allImages: catchItem.imageUrl ? [catchItem.imageUrl] : [],
        });
        processedIds.add(catchItem.id);
      }
    }

    const regularCatches = groupedCatches.slice(0, 20);
    const surfacedCatchIds = new Set(surfacedFromReplies.map((c) => c.id));
    const uniqueRegularCatches = regularCatches.filter(
      (c) => !surfacedCatchIds.has(c.id),
    );
    const combinedCatches = [
      ...surfacedFromReplies,
      ...uniqueRegularCatches,
    ].slice(0, 30);

    const allCatchIds = combinedCatches.flatMap((item) => [
      item.id,
      ...(item.relatedCatches?.map((c) => c.id) ?? []),
    ]);

    const [allReactions, savedPosts] = await Promise.all([
      allCatchIds.length > 0
        ? prisma.reaction.findMany({
            where: { catchId: { in: allCatchIds } },
            select: { catchId: true, emoji: true, userId: true },
          })
        : Promise.resolve([]),
      userId && allCatchIds.length > 0
        ? prisma.savedPost.findMany({
            where: {
              userId,
              catchId: { in: combinedCatches.map((c) => c.id) },
            },
            select: { catchId: true },
          })
        : Promise.resolve([]),
    ]);

    const reactionsByCatch = new Map<
      string,
      Array<{ emoji: string; userId: string }>
    >();
    for (const reaction of allReactions) {
      const list = reactionsByCatch.get(reaction.catchId) ?? [];
      list.push({ emoji: reaction.emoji, userId: reaction.userId });
      reactionsByCatch.set(reaction.catchId, list);
    }

    const savedIds = new Set(savedPosts.map((row) => row.catchId));

    return combinedCatches.map((catchItem) => {
      const relatedIds = [
        catchItem.id,
        ...(catchItem.relatedCatches?.map((c) => c.id) ?? []),
      ];
      const reactions = relatedIds.flatMap(
        (id) => reactionsByCatch.get(id) ?? [],
      );

      return {
        ...catchItem,
        likesCount: catchItem._count?.likes || 0,
        reactions,
        isSaved: savedIds.has(catchItem.id),
      };
    });
  } catch (error) {
    console.error('Feed fetch error:', error);
    return [];
  }
}
