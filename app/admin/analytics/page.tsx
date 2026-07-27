export const dynamic = 'force-dynamic';

import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AnalyticsClient } from '@/admin/analytics/AnalyticsClient';

type DayCount = { day: Date; count: bigint | number };

function fillDailySeries(
  start: Date,
  days: number,
  rows: DayCount[],
): Array<{ date: string; value: number }> {
  const byDay = new Map(
    rows.map((row) => [
      new Date(row.day).toISOString().split('T')[0],
      Number(row.count),
    ]),
  );

  const series: Array<{ date: string; value: number }> = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const key = date.toISOString().split('T')[0];
    series.push({ date: key, value: byDay.get(key) ?? 0 });
  }
  return series;
}

async function getAnalyticsData() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);

  const [
    signupRows,
    catchRows,
    dauRows,
    catchPosted,
    likesGiven,
    commentsPosted,
    followsCreated,
    referralsGenerated,
    speciesCounts,
    locationCounts,
    countryCounts,
    premiumByType,
  ] = await Promise.all([
    prisma.$queryRaw<DayCount[]>(Prisma.sql`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
      FROM "User"
      WHERE "createdAt" >= ${start}
      GROUP BY 1
      ORDER BY 1
    `),
    prisma.$queryRaw<DayCount[]>(Prisma.sql`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
      FROM "Catch"
      WHERE "createdAt" >= ${start}
      GROUP BY 1
      ORDER BY 1
    `),
    prisma.$queryRaw<DayCount[]>(Prisma.sql`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(DISTINCT "userId")::int AS count
      FROM "Catch"
      WHERE "createdAt" >= ${start}
      GROUP BY 1
      ORDER BY 1
    `),
    prisma.catch.count({ where: { createdAt: { gte: start } } }),
    prisma.like.count({ where: { createdAt: { gte: start } } }),
    prisma.comment.count({ where: { createdAt: { gte: start } } }),
    prisma.follow.count({ where: { createdAt: { gte: start } } }),
    prisma.referral.count({ where: { createdAt: { gte: start } } }),
    prisma.catch.groupBy({
      by: ['species'],
      _count: { id: true },
      where: { species: { not: null } },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prisma.catch.groupBy({
      by: ['location'],
      _count: { id: true },
      where: { location: { not: null } },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prisma.user.groupBy({
      by: ['country'],
      _count: { id: true },
      where: { country: { not: null } },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prisma.user.groupBy({
      by: ['proType'],
      _count: { id: true },
      where: { isPro: true },
    }),
  ]);

  return {
    signupsTrend: fillDailySeries(start, 30, signupRows),
    catchesTrend: fillDailySeries(start, 30, catchRows),
    dauTrend: fillDailySeries(start, 30, dauRows),
    featureUsage: {
      catchPosted,
      likesGiven,
      commentsPosted,
      followsCreated,
      referralsGenerated,
    },
    topSpecies: speciesCounts.map((s) => ({
      name: s.species || 'Unknown',
      count: s._count.id,
    })),
    topLocations: locationCounts.map((l) => ({
      name: l.location || 'Unknown',
      count: l._count.id,
    })),
    countryDistribution: countryCounts.map((c) => ({
      country: c.country || 'Unknown',
      count: c._count.id,
    })),
    premiumDistribution: premiumByType.map((p) => ({
      type: p.proType || 'Unknown',
      count: p._count.id,
    })),
  };
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  return <AnalyticsClient data={data} />;
}
