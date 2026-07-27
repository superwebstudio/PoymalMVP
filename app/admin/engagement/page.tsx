export const dynamic = 'force-dynamic';

import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { EngagementClient } from '@/admin/engagement/EngagementClient';

type DayTriple = {
  day: Date;
  catches: bigint | number;
  likes: bigint | number;
  comments: bigint | number;
};

async function getEngagementData() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const start = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);

  const [
    totalCatches,
    totalLikes,
    totalComments,
    totalReactions,
    totalFollows,
    catchesThisWeek,
    likesThisWeek,
    commentsThisWeek,
    totalUsers,
    recentActivity,
    dailyRows,
    topCatches,
    hourlyActivity,
    methodStats,
  ] = await Promise.all([
    prisma.catch.count(),
    prisma.like.count(),
    prisma.comment.count(),
    prisma.reaction.count(),
    prisma.follow.count(),
    prisma.catch.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.like.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.comment.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count(),
    prisma.catch.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: monthAgo } },
      _count: { id: true },
    }),
    prisma.$queryRaw<DayTriple[]>(Prisma.sql`
      WITH days AS (
        SELECT generate_series(
          date_trunc('day', ${start}::timestamp),
          date_trunc('day', ${today}::timestamp),
          interval '1 day'
        ) AS day
      )
      SELECT
        d.day,
        COALESCE(c.cnt, 0)::int AS catches,
        COALESCE(l.cnt, 0)::int AS likes,
        COALESCE(cm.cnt, 0)::int AS comments
      FROM days d
      LEFT JOIN (
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS cnt
        FROM "Catch"
        WHERE "createdAt" >= ${start}
        GROUP BY 1
      ) c ON c.day = d.day
      LEFT JOIN (
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS cnt
        FROM "Like"
        WHERE "createdAt" >= ${start}
        GROUP BY 1
      ) l ON l.day = d.day
      LEFT JOIN (
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS cnt
        FROM "Comment"
        WHERE "createdAt" >= ${start}
        GROUP BY 1
      ) cm ON cm.day = d.day
      ORDER BY d.day
    `),
    prisma.catch.findMany({
      take: 5,
      orderBy: { likes: { _count: 'desc' } },
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
    }),
    prisma.$queryRaw<{ hour: number; count: bigint }[]>`
      SELECT EXTRACT(HOUR FROM "createdAt") as hour, COUNT(*) as count
      FROM "Catch"
      WHERE "createdAt" > NOW() - INTERVAL '30 days'
      GROUP BY EXTRACT(HOUR FROM "createdAt")
      ORDER BY hour
    `,
    prisma.catch.groupBy({
      by: ['method'],
      _count: { id: true },
      where: { method: { not: null } },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ]);

  const activeUserIds = new Set(recentActivity.map((u) => u.userId));
  let deadUsers = totalUsers - activeUserIds.size;
  let casualUsers = 0;
  let regularUsers = 0;
  let powerUsers = 0;

  recentActivity.forEach((activity) => {
    const catchCount = activity._count.id;
    if (catchCount >= 12) powerUsers++;
    else if (catchCount >= 4) regularUsers++;
    else casualUsers++;
  });

  const avgCatchesPerUser = totalUsers > 0 ? totalCatches / totalUsers : 0;
  const avgLikesPerCatch = totalCatches > 0 ? totalLikes / totalCatches : 0;
  const avgCommentsPerCatch = totalCatches > 0 ? totalComments / totalCatches : 0;

  const dailyActivity = dailyRows.map((row) => ({
    date: new Date(row.day).toISOString().split('T')[0],
    catches: Number(row.catches),
    likes: Number(row.likes),
    comments: Number(row.comments),
  }));

  const activityByHour = Array.from({ length: 24 }, (_, i) => {
    const found = hourlyActivity.find((h) => Number(h.hour) === i);
    return {
      hour: i,
      count: found ? Number(found.count) : 0,
    };
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
    topCatches: topCatches.map((c) => ({
      id: c.id,
      species: c.species,
      imageUrl: c.imageUrl,
      user: c.user,
      likesCount: c._count.likes,
      commentsCount: c._count.comments,
    })),
    activityByHour,
    topMethods: methodStats.map((m) => ({
      method: m.method || 'Unknown',
      count: m._count.id,
    })),
  };
}

export default async function EngagementPage() {
  const data = await getEngagementData();
  return <EngagementClient data={data} />;
}
