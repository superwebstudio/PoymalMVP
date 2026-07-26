export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import { EngagementClient } from "@/admin/engagement/EngagementClient";

async function getEngagementData() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Total counts
  const totalCatches = await prisma.catch.count();
  const totalLikes = await prisma.like.count();
  const totalComments = await prisma.comment.count();
  const totalReactions = await prisma.reaction.count();
  const totalFollows = await prisma.follow.count();

  // This week
  const catchesThisWeek = await prisma.catch.count({ where: { createdAt: { gte: weekAgo } } });
  const likesThisWeek = await prisma.like.count({ where: { createdAt: { gte: weekAgo } } });
  const commentsThisWeek = await prisma.comment.count({ where: { createdAt: { gte: weekAgo } } });

  // User segments
  const totalUsers = await prisma.user.count();
  
  // Users who posted in last 30 days grouped by activity
  const recentActivity = await prisma.catch.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: monthAgo } },
    _count: { id: true },
  });

  const activeUserIds = new Set(recentActivity.map(u => u.userId));
  let deadUsers = totalUsers - activeUserIds.size;
  let casualUsers = 0;
  let regularUsers = 0;
  let powerUsers = 0;

  recentActivity.forEach(activity => {
    const catchCount = activity._count.id;
    if (catchCount >= 12) powerUsers++;
    else if (catchCount >= 4) regularUsers++;
    else casualUsers++;
  });

  // Avg catches per user
  const avgCatchesPerUser = totalUsers > 0 ? totalCatches / totalUsers : 0;
  const avgLikesPerCatch = totalCatches > 0 ? totalLikes / totalCatches : 0;
  const avgCommentsPerCatch = totalCatches > 0 ? totalComments / totalCatches : 0;

  // Daily activity trend
  const dates = [];
  for (let i = 29; i >= 0; i--) {
    dates.push(new Date(today.getTime() - i * 24 * 60 * 60 * 1000));
  }

  const dailyActivity = await Promise.all(
    dates.map(async (date) => {
      const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      const catches = await prisma.catch.count({
        where: { createdAt: { gte: date, lt: nextDay } },
      });
      const likes = await prisma.like.count({
        where: { createdAt: { gte: date, lt: nextDay } },
      });
      const comments = await prisma.comment.count({
        where: { createdAt: { gte: date, lt: nextDay } },
      });
      return {
        date: date.toISOString().split('T')[0],
        catches,
        likes,
        comments,
      };
    })
  );

  // Most engaged catches
  const topCatches = await prisma.catch.findMany({
    take: 5,
    orderBy: {
      likes: { _count: 'desc' },
    },
    include: {
      user: {
        select: {
          firstName: true,
          username: true,
          photoUrl: true,
        },
      },
      _count: {
        select: { likes: true, comments: true },
      },
    },
  });

  // Activity by hour (when do people post)
  const hourlyActivity = await prisma.$queryRaw<{ hour: number; count: bigint }[]>`
    SELECT EXTRACT(HOUR FROM "createdAt") as hour, COUNT(*) as count
    FROM "Catch"
    WHERE "createdAt" > NOW() - INTERVAL '30 days'
    GROUP BY EXTRACT(HOUR FROM "createdAt")
    ORDER BY hour
  `;

  // Fill in missing hours
  const activityByHour = Array.from({ length: 24 }, (_, i) => {
    const found = hourlyActivity.find(h => Number(h.hour) === i);
    return {
      hour: i,
      count: found ? Number(found.count) : 0,
    };
  });

  // Most used methods
  const methodStats = await prisma.catch.groupBy({
    by: ['method'],
    _count: { id: true },
    where: { method: { not: null } },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });

  return {
    totals: {
      catches: totalCatches,
      likes: totalLikes,
      comments: totalComments,
      reactions: totalReactions,
      follows: totalFollows,
    },
    thisWeek: {
      catches: catchesThisWeek,
      likes: likesThisWeek,
      comments: commentsThisWeek,
    },
    segments: {
      deadUsers,
      casualUsers,
      regularUsers,
      powerUsers,
      total: totalUsers,
    },
    averages: {
      catchesPerUser: Math.round(avgCatchesPerUser * 10) / 10,
      likesPerCatch: Math.round(avgLikesPerCatch * 10) / 10,
      commentsPerCatch: Math.round(avgCommentsPerCatch * 10) / 10,
    },
    dailyActivity,
    topCatches: topCatches.map(c => ({
      id: c.id,
      species: c.species,
      imageUrl: c.imageUrl,
      user: c.user,
      likesCount: c._count.likes,
      commentsCount: c._count.comments,
    })),
    activityByHour,
    topMethods: methodStats.map(m => ({
      method: m.method || 'Unknown',
      count: m._count.id,
    })),
  };
}

export default async function EngagementPage() {
  const data = await getEngagementData();
  return <EngagementClient data={data} />;
}

