export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import { ReferralsClient } from "@/admin/referrals/ReferralsClient";

async function getReferralsData() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Core referral metrics
  const totalReferrals = await prisma.referral.count();
  const pendingReferrals = await prisma.referral.count({ where: { status: 'pending' } });
  const completedReferrals = await prisma.referral.count({ where: { status: 'completed' } });
  const expiredReferrals = await prisma.referral.count({ where: { status: 'expired' } });

  // Referrals this week
  const referralsThisWeek = await prisma.referral.count({
    where: { createdAt: { gte: weekAgo } },
  });

  // Completed this week
  const completedThisWeek = await prisma.referral.count({
    where: {
      status: 'completed',
      firstPostAt: { gte: weekAgo },
    },
  });

  // Total premium days awarded
  const totalDaysAwarded = await prisma.referral.aggregate({
    _sum: { daysAwarded: true },
    where: { status: 'completed' },
  });

  // Premium days cost (assuming €4.99/30 days = ~€0.166 per day)
  const costPerDay = 4.99 / 30;
  const totalCost = (totalDaysAwarded._sum.daysAwarded || 0) * costPerDay;

  // Conversion rate
  const conversionRate = totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0;

  // Top referrers
  const topReferrers = await prisma.user.findMany({
    where: { totalCompletedReferrals: { gt: 0 } },
    orderBy: { totalCompletedReferrals: 'desc' },
    take: 10,
    select: {
      id: true,
      firstName: true,
      username: true,
      photoUrl: true,
      totalCompletedReferrals: true,
      premiumDaysBalance: true,
      isPro: true,
    },
  });

  // Daily referrals trend (last 30 days)
  const dates = [];
  for (let i = 29; i >= 0; i--) {
    dates.push(new Date(today.getTime() - i * 24 * 60 * 60 * 1000));
  }

  const dailyReferrals = await Promise.all(
    dates.map(async (date) => {
      const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      const created = await prisma.referral.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDay,
          },
        },
      });
      const completed = await prisma.referral.count({
        where: {
          status: 'completed',
          firstPostAt: {
            gte: date,
            lt: nextDay,
          },
        },
      });
      return {
        date: date.toISOString().split('T')[0],
        created,
        completed,
      };
    })
  );

  // Recent referrals
  const recentReferrals = await prisma.referral.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      referrer: {
        select: {
          firstName: true,
          username: true,
          photoUrl: true,
        },
      },
      referred: {
        select: {
          firstName: true,
          username: true,
          photoUrl: true,
        },
      },
    },
  });

  // Users with most premium days balance
  const topDaysBalance = await prisma.user.findMany({
    where: { premiumDaysBalance: { gt: 0 } },
    orderBy: { premiumDaysBalance: 'desc' },
    take: 5,
    select: {
      id: true,
      firstName: true,
      username: true,
      photoUrl: true,
      premiumDaysBalance: true,
    },
  });

  return {
    totalReferrals,
    pendingReferrals,
    completedReferrals,
    expiredReferrals,
    referralsThisWeek,
    completedThisWeek,
    totalDaysAwarded: totalDaysAwarded._sum.daysAwarded || 0,
    totalCost: Math.round(totalCost * 100) / 100,
    conversionRate: Math.round(conversionRate * 10) / 10,
    topReferrers,
    dailyReferrals,
    recentReferrals: recentReferrals.map(r => ({
      ...r,
      expiresAt: r.expiresAt,
      firstPostAt: r.firstPostAt,
    })),
    topDaysBalance,
  };
}

export default async function ReferralsPage() {
  const data = await getReferralsData();
  return <ReferralsClient data={data} />;
}

