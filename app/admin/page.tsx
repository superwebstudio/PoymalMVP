export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import { DashboardClient } from "@/admin/DashboardClient";
import type { DashboardMetrics, UserSegments, FunnelStep } from "@/admin/types";

async function getDashboardData(): Promise<{
  metrics: DashboardMetrics;
  segments: UserSegments;
  funnel: FunnelStep[];
  recentUsers: any[];
  recentCatches: any[];
}> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Growth metrics
  const totalUsers = await prisma.user.count();
  
  const newSignupsToday = await prisma.user.count({
    where: { createdAt: { gte: today } },
  });
  
  const newSignupsThisWeek = await prisma.user.count({
    where: { createdAt: { gte: weekAgo } },
  });

  // Active users (based on recent catches or activity)
  const activeUsersToday = await prisma.catch.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: today } },
  });
  
  const activeUsersWeek = await prisma.catch.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: weekAgo } },
  });

  // Engagement metrics
  const totalCatches = await prisma.catch.count();
  
  const catchesToday = await prisma.catch.count({
    where: { createdAt: { gte: today } },
  });
  
  const catchesThisWeek = await prisma.catch.count({
    where: { createdAt: { gte: weekAgo } },
  });

  // Users with catches
  const usersWithCatches = await prisma.catch.groupBy({
    by: ['userId'],
  });

  const usersWithThreePlus = await prisma.catch.groupBy({
    by: ['userId'],
    having: {
      userId: {
        _count: { gte: 3 },
      },
    },
  });

  // Revenue metrics
  const premiumUsers = await prisma.user.count({
    where: { isPro: true },
  });

  const monthlyPremium = await prisma.user.count({
    where: { isPro: true, proType: 'monthly' },
  });

  const yearlyPremium = await prisma.user.count({
    where: { isPro: true, proType: 'yearly' },
  });

  // Referral metrics
  const totalReferrals = await prisma.referral.count();
  
  const completedReferrals = await prisma.referral.count({
    where: { status: 'completed' },
  });

  const totalDaysAwarded = await prisma.referral.aggregate({
    _sum: { daysAwarded: true },
    where: { status: 'completed' },
  });

  // User segments (based on catch activity in last 30 days)
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
    if (catchCount >= 12) { // 3+ per week
      powerUsers++;
    } else if (catchCount >= 4) { // 1+ per week
      regularUsers++;
    } else {
      casualUsers++;
    }
  });

  // Recent users
  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { catches: true },
      },
    },
  });

  // Recent catches
  const recentCatches = await prisma.catch.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
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

  // Calculate derived metrics
  const freeUsers = totalUsers - premiumUsers;
  const avgCatchesPerUser = totalUsers > 0 ? totalCatches / totalUsers : 0;
  const usersWithAtLeastOneCatch = usersWithCatches.length;
  const activationRate = totalUsers > 0 ? (usersWithThreePlus.length / totalUsers) * 100 : 0;
  const conversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;

  // MRR calculation (assuming €4.99 monthly, €39.99 yearly)
  const mrr = (monthlyPremium * 4.99) + (yearlyPremium * (39.99 / 12));
  const arpu = totalUsers > 0 ? mrr / totalUsers : 0;

  // Retention calculations (simplified - would need proper cohort tracking)
  const day1Retention = 60; // Placeholder - implement actual tracking
  const day7Retention = 35;
  const day30Retention = 20;

  // Funnel data
  const funnel: FunnelStep[] = [
    { label: 'Total Users', count: totalUsers, percentage: 100 },
    { label: 'Posted First Catch', count: usersWithAtLeastOneCatch, percentage: totalUsers > 0 ? (usersWithAtLeastOneCatch / totalUsers) * 100 : 0, dropOff: totalUsers > 0 ? 100 - (usersWithAtLeastOneCatch / totalUsers) * 100 : 0 },
    { label: 'Activated (3+ catches)', count: usersWithThreePlus.length, percentage: totalUsers > 0 ? (usersWithThreePlus.length / totalUsers) * 100 : 0, dropOff: usersWithAtLeastOneCatch > 0 ? 100 - (usersWithThreePlus.length / usersWithAtLeastOneCatch) * 100 : 0 },
    { label: 'Premium', count: premiumUsers, percentage: totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0, dropOff: usersWithThreePlus.length > 0 ? 100 - (premiumUsers / usersWithThreePlus.length) * 100 : 0 },
  ];

  return {
    metrics: {
      totalUsers,
      dailyActiveUsers: activeUsersToday.length,
      weeklyActiveUsers: activeUsersWeek.length,
      newSignupsToday,
      newSignupsThisWeek,
      retention: {
        day1: day1Retention,
        day7: day7Retention,
        day30: day30Retention,
      },
      totalCatches,
      catchesToday,
      catchesThisWeek,
      avgCatchesPerUser: Math.round(avgCatchesPerUser * 10) / 10,
      usersWithAtLeastOneCatch,
      usersWithThreePlusCatches: usersWithThreePlus.length,
      activationRate: Math.round(activationRate * 10) / 10,
      totalPremiumUsers: premiumUsers,
      freeUsers,
      premiumUsers,
      monthlyRecurringRevenue: Math.round(mrr * 100) / 100,
      conversionRate: Math.round(conversionRate * 10) / 10,
      averageRevenuePerUser: Math.round(arpu * 100) / 100,
      totalReferralLinks: totalReferrals,
      completedReferrals,
      referralConversionRate: totalReferrals > 0 ? Math.round((completedReferrals / totalReferrals) * 100 * 10) / 10 : 0,
      premiumDaysGiven: totalDaysAwarded._sum.daysAwarded || 0,
    },
    segments: {
      deadUsers,
      casualUsers,
      regularUsers,
      powerUsers,
    },
    funnel,
    recentUsers: recentUsers.map(u => ({
      ...u,
      totalCatches: u._count.catches,
    })),
    recentCatches: recentCatches.map(c => ({
      ...c,
      likesCount: c._count.likes,
      commentsCount: c._count.comments,
    })),
  };
}

export default async function AdminDashboard() {
  const data = await getDashboardData();
  
  return <DashboardClient data={data} />;
}

