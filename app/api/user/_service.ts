import prisma from '@/lib/prisma';

const PROFILE_CATCH_LIMIT = 100;

export async function getUserProfile(id: string) {
  try {
    if (!id) return null;

    const [user, followersCount, followingCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        include: {
          catches: {
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
            take: PROFILE_CATCH_LIMIT,
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
      }),
      prisma.follow.count({ where: { followingId: id } }),
      prisma.follow.count({ where: { followerId: id } }),
    ]);

    if (!user) return null;

    const groupedCatches: Array<Record<string, unknown>> = [];
    const processedIds = new Set<string>();

    for (const catchItem of user.catches) {
      if (processedIds.has(catchItem.id)) continue;

      const catchTime = new Date(catchItem.createdAt).getTime();
      const timeWindowStart = catchTime - 5000;
      const timeWindowEnd = catchTime + 5000;

      const related = user.catches.filter(
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
        const totalViews = sortedRelated.reduce(
          (sum, c) => sum + (c._count?.views || 0),
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
            views: totalViews,
          },
          _reactionCatchIds: sortedRelated.map((c) => c.id),
        });

        related.forEach((c) => processedIds.add(c.id));
      } else {
        groupedCatches.push({
          ...catchItem,
          allImages: catchItem.imageUrl ? [catchItem.imageUrl] : [],
          _reactionCatchIds: [catchItem.id],
        });
        processedIds.add(catchItem.id);
      }
    }

    const reactionCatchIds = groupedCatches.flatMap(
      (item) => (item._reactionCatchIds as string[]) || [],
    );

    const reactions =
      reactionCatchIds.length > 0
        ? await prisma.reaction.findMany({
            where: { catchId: { in: reactionCatchIds } },
            select: { catchId: true, emoji: true, userId: true },
          })
        : [];

    const reactionsByCatch = new Map<
      string,
      Array<{ emoji: string; userId: string }>
    >();
    for (const reaction of reactions) {
      const list = reactionsByCatch.get(reaction.catchId) ?? [];
      list.push({ emoji: reaction.emoji, userId: reaction.userId });
      reactionsByCatch.set(reaction.catchId, list);
    }

    const catchesWithReactions = groupedCatches.map((item) => {
      const ids = (item._reactionCatchIds as string[]) || [];
      const { _reactionCatchIds: _unused, ...rest } = item;
      void _unused;
      return {
        ...rest,
        reactions: ids.flatMap((catchId) => reactionsByCatch.get(catchId) ?? []),
      };
    });

    return {
      ...user,
      catches: catchesWithReactions,
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
