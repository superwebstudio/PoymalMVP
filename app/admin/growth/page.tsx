import prisma from "@/lib/prisma";
import { GrowthClient } from "@/admin/growth/GrowthClient";

async function getGrowthData() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Current week signups
  const signupsThisWeek = await prisma.user.count({
    where: { createdAt: { gte: weekAgo } },
  });

  // Last week signups
  const signupsLastWeek = await prisma.user.count({
    where: {
      createdAt: {
        gte: twoWeeksAgo,
        lt: weekAgo,
      },
    },
  });

  // Calculate growth rate
  const weekOverWeekGrowth = signupsLastWeek > 0 
    ? ((signupsThisWeek - signupsLastWeek) / signupsLastWeek) * 100 
    : 0;

  // Get cumulative user growth by day for last 30 days
  const dates = [];
  for (let i = 29; i >= 0; i--) {
    dates.push(new Date(today.getTime() - i * 24 * 60 * 60 * 1000));
  }

  const cumulativeGrowth = await Promise.all(
    dates.map(async (date) => {
      const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      const totalUsers = await prisma.user.count({
        where: { createdAt: { lt: nextDay } },
      });
      const newUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDay,
          },
        },
      });
      return {
        date: date.toISOString().split('T')[0],
        totalUsers,
        newUsers,
      };
    })
  );

  // Retention cohorts (simplified)
  const cohorts = await Promise.all([
    { days: 1, label: 'Day 1' },
    { days: 7, label: 'Day 7' },
    { days: 30, label: 'Day 30' },
  ].map(async ({ days, label }) => {
    const cohortStart = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    const cohortEnd = new Date(cohortStart.getTime() + 24 * 60 * 60 * 1000);
    
    // Users who signed up on that day
    const signedUp = await prisma.user.count({
      where: {
        createdAt: {
          gte: cohortStart,
          lt: cohortEnd,
        },
      },
    });

    // Users who came back (posted a catch after Day 1)
    const returned = await prisma.catch.groupBy({
      by: ['userId'],
      where: {
        user: {
          createdAt: {
            gte: cohortStart,
            lt: cohortEnd,
          },
        },
        createdAt: {
          gt: cohortEnd,
        },
      },
    });

    return {
      label,
      signedUp,
      returned: returned.length,
      retentionRate: signedUp > 0 ? (returned.length / signedUp) * 100 : 0,
    };
  }));

  // New users funnel
  const totalUsers = await prisma.user.count();
  const usersWithCatches = await prisma.catch.groupBy({ by: ['userId'] });
  const usersWithThreePlus = await prisma.catch.groupBy({
    by: ['userId'],
    having: { userId: { _count: { gte: 3 } } },
  });
  const premiumUsers = await prisma.user.count({ where: { isPro: true } });

  // Signup source analysis (by country for now)
  const signupsByCountry = await prisma.user.groupBy({
    by: ['country'],
    _count: { id: true },
    where: {
      createdAt: { gte: monthAgo },
      country: { not: null },
    },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });

  return {
    signupsThisWeek,
    signupsLastWeek,
    weekOverWeekGrowth: Math.round(weekOverWeekGrowth * 10) / 10,
    totalUsers,
    cumulativeGrowth,
    retentionCohorts: cohorts,
    funnel: {
      totalUsers,
      usersWithCatches: usersWithCatches.length,
      activatedUsers: usersWithThreePlus.length,
      premiumUsers,
    },
    signupsBySource: signupsByCountry.map(s => ({
      source: s.country || 'Unknown',
      count: s._count.id,
    })),
  };
}

export default async function GrowthPage() {
  const data = await getGrowthData();
  return <GrowthClient data={data} />;
}

