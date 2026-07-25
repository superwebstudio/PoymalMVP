import prisma from "@/lib/prisma";
import { RevenueClient } from "@/admin/revenue/RevenueClient";

async function getRevenueData() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Premium user counts
  const totalPremium = await prisma.user.count({ where: { isPro: true } });
  const monthlyPremium = await prisma.user.count({ where: { isPro: true, proType: 'monthly' } });
  const yearlyPremium = await prisma.user.count({ where: { isPro: true, proType: 'yearly' } });
  const totalFree = await prisma.user.count({ where: { isPro: false } });

  // MRR calculation
  const monthlyMRR = monthlyPremium * 4.99;
  const yearlyMRR = yearlyPremium * (39.99 / 12);
  const totalMRR = monthlyMRR + yearlyMRR;

  // New premium this month
  const newPremiumThisMonth = await prisma.transaction.count({
    where: {
      createdAt: { gte: monthAgo },
      status: 'completed',
    },
  });

  // Last month's new premium for comparison
  const newPremiumLastMonth = await prisma.transaction.count({
    where: {
      createdAt: {
        gte: twoMonthsAgo,
        lt: monthAgo,
      },
      status: 'completed',
    },
  });

  // Transaction history (last 30 days)
  const dates = [];
  for (let i = 29; i >= 0; i--) {
    dates.push(new Date(today.getTime() - i * 24 * 60 * 60 * 1000));
  }

  const dailyRevenue = await Promise.all(
    dates.map(async (date) => {
      const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      const transactions = await prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: date,
            lt: nextDay,
          },
          status: 'completed',
        },
        select: { amount: true, type: true },
      });
      
      // Calculate revenue (assuming Telegram Stars at ~$0.02 each, converted to EUR)
      const revenue = transactions.reduce((sum, t) => {
        // Convert stars to EUR (approximate)
        const eurValue = t.type === 'yearly' ? 39.99 : 4.99;
        return sum + eurValue;
      }, 0);

      return {
        date: date.toISOString().split('T')[0],
        revenue,
        transactions: transactions.length,
      };
    })
  );

  // Recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          firstName: true,
          username: true,
          photoUrl: true,
        },
      },
    },
  });

  // Premium conversion funnel
  const totalUsers = await prisma.user.count();
  const usersWithCatches = await prisma.catch.groupBy({ by: ['userId'] });
  const usersWithThreePlus = await prisma.catch.groupBy({
    by: ['userId'],
    having: { userId: { _count: { gte: 3 } } },
  });

  // Calculate ARPU and LTV
  const arpu = totalUsers > 0 ? totalMRR / totalUsers : 0;
  // Estimate churn at 8% (would need proper tracking in production)
  const estimatedChurnRate = 0.08;
  const ltv = estimatedChurnRate > 0 ? (arpu / estimatedChurnRate) : 0;

  // Conversion rate
  const conversionRate = totalUsers > 0 ? (totalPremium / totalUsers) * 100 : 0;

  return {
    totalMRR: Math.round(totalMRR * 100) / 100,
    monthlyMRR: Math.round(monthlyMRR * 100) / 100,
    yearlyMRR: Math.round(yearlyMRR * 100) / 100,
    totalPremium,
    monthlyPremium,
    yearlyPremium,
    totalFree,
    arpu: Math.round(arpu * 100) / 100,
    ltv: Math.round(ltv * 100) / 100,
    conversionRate: Math.round(conversionRate * 10) / 10,
    newPremiumThisMonth,
    newPremiumLastMonth,
    monthOverMonthGrowth: newPremiumLastMonth > 0 
      ? Math.round(((newPremiumThisMonth - newPremiumLastMonth) / newPremiumLastMonth) * 100 * 10) / 10 
      : 0,
    dailyRevenue,
    recentTransactions: recentTransactions.map(t => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      status: t.status,
      createdAt: t.createdAt,
      user: t.user,
    })),
    funnel: {
      totalUsers,
      usersWithCatches: usersWithCatches.length,
      activatedUsers: usersWithThreePlus.length,
      premiumUsers: totalPremium,
    },
  };
}

export default async function RevenuePage() {
  const data = await getRevenueData();
  return <RevenueClient data={data} />;
}

