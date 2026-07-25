import prisma from "@/lib/prisma";
import { AnalyticsClient } from "@/admin/analytics/AnalyticsClient";

async function getAnalyticsData() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Get data for last 30 days
  const dates = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    dates.push(date);
  }

  // Daily signups
  const signupsByDay = await Promise.all(
    dates.map(async (date) => {
      const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDay,
          },
        },
      });
      return {
        date: date.toISOString().split('T')[0],
        value: count,
      };
    })
  );

  // Daily catches
  const catchesByDay = await Promise.all(
    dates.map(async (date) => {
      const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      const count = await prisma.catch.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDay,
          },
        },
      });
      return {
        date: date.toISOString().split('T')[0],
        value: count,
      };
    })
  );

  // Daily active users (users who posted a catch)
  const dauByDay = await Promise.all(
    dates.map(async (date) => {
      const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      const activeUsers = await prisma.catch.groupBy({
        by: ['userId'],
        where: {
          createdAt: {
            gte: date,
            lt: nextDay,
          },
        },
      });
      return {
        date: date.toISOString().split('T')[0],
        value: activeUsers.length,
      };
    })
  );

  // Feature usage
  const featureUsage = {
    catchPosted: await prisma.catch.count({ where: { createdAt: { gte: dates[0] } } }),
    likesGiven: await prisma.like.count({ where: { createdAt: { gte: dates[0] } } }),
    commentsPosted: await prisma.comment.count({ where: { createdAt: { gte: dates[0] } } }),
    followsCreated: await prisma.follow.count({ where: { createdAt: { gte: dates[0] } } }),
    referralsGenerated: await prisma.referral.count({ where: { createdAt: { gte: dates[0] } } }),
  };

  // Species popularity
  const speciesCounts = await prisma.catch.groupBy({
    by: ['species'],
    _count: { id: true },
    where: {
      species: { not: null },
    },
    orderBy: {
      _count: { id: 'desc' },
    },
    take: 10,
  });

  // Location popularity
  const locationCounts = await prisma.catch.groupBy({
    by: ['location'],
    _count: { id: true },
    where: {
      location: { not: null },
    },
    orderBy: {
      _count: { id: 'desc' },
    },
    take: 10,
  });

  // Country distribution
  const countryCounts = await prisma.user.groupBy({
    by: ['country'],
    _count: { id: true },
    where: {
      country: { not: null },
    },
    orderBy: {
      _count: { id: 'desc' },
    },
    take: 10,
  });

  // Premium stats
  const premiumByType = await prisma.user.groupBy({
    by: ['proType'],
    _count: { id: true },
    where: {
      isPro: true,
    },
  });

  return {
    signupsTrend: signupsByDay,
    catchesTrend: catchesByDay,
    dauTrend: dauByDay,
    featureUsage,
    topSpecies: speciesCounts.map(s => ({ name: s.species || 'Unknown', count: s._count.id })),
    topLocations: locationCounts.map(l => ({ name: l.location || 'Unknown', count: l._count.id })),
    countryDistribution: countryCounts.map(c => ({ country: c.country || 'Unknown', count: c._count.id })),
    premiumDistribution: premiumByType.map(p => ({ type: p.proType || 'Unknown', count: p._count.id })),
  };
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  
  return <AnalyticsClient data={data} />;
}

