import prisma from "@/lib/prisma";
import { ModerationClient } from "@/admin/moderation/ModerationClient";

async function getModerationData() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Suspicious activity detection

  // 1. Users with many referrals (potential abuse)
  const suspiciousReferrers = await prisma.user.findMany({
    where: {
      totalCompletedReferrals: { gte: 5 },
      createdAt: { gte: weekAgo },
    },
    select: {
      id: true,
      firstName: true,
      username: true,
      photoUrl: true,
      totalCompletedReferrals: true,
      createdAt: true,
    },
    orderBy: { totalCompletedReferrals: 'desc' },
    take: 10,
  });

  // 2. Users who posted many catches quickly (potential bot)
  const rapidPosters = await prisma.catch.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: today } },
    having: {
      userId: {
        _count: { gte: 5 },
      },
    },
    _count: { id: true },
  });

  const rapidPosterDetails = (
    await Promise.all(
      rapidPosters.map(async (rp) => {
        const user = await prisma.user.findUnique({
          where: { id: rp.userId },
          select: {
            id: true,
            firstName: true,
            username: true,
            photoUrl: true,
            createdAt: true,
          },
        });
        if (!user) return null;
        return {
          id: user.id,
          firstName: user.firstName,
          username: user.username,
          photoUrl: user.photoUrl,
          catchesToday: rp._count.id,
        };
      })
    )
  ).filter(
    (user): user is {
      id: string;
      firstName: string | null;
      username: string | null;
      photoUrl: string | null;
      catchesToday: number;
    } => user !== null
  );

  // 3. Recent catches without GPS data (potential fake)
  const noGpsCatches = await prisma.catch.findMany({
    where: {
      createdAt: { gte: weekAgo },
      latitude: null,
      longitude: null,
      imageUrl: { not: null },
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          username: true,
          photoUrl: true,
        },
      },
    },
  });

  // 4. Users with suspicious email patterns (test accounts)
  const suspiciousAccounts = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: 'test', mode: 'insensitive' } },
        { firstName: { contains: 'test', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      username: true,
      photoUrl: true,
      createdAt: true,
      _count: {
        select: { catches: true },
      },
    },
    take: 10,
  });

  // 5. Recent user reports (if you have a report system)
  // For now, we'll simulate with users who have many comments deleted or hidden posts
  const flaggedContent = await prisma.catch.findMany({
    where: {
      isPublic: false,
      createdAt: { gte: weekAgo },
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          username: true,
          photoUrl: true,
        },
      },
    },
  });

  // Stats
  const totalUsersToday = await prisma.user.count({ where: { createdAt: { gte: today } } });
  const totalCatchesToday = await prisma.catch.count({ where: { createdAt: { gte: today } } });

  return {
    flags: {
      suspiciousReferrers: suspiciousReferrers.length,
      rapidPosters: rapidPosterDetails.length,
      noGpsCatches: noGpsCatches.length,
      testAccounts: suspiciousAccounts.length,
      hiddenContent: flaggedContent.length,
    },
    suspiciousReferrers,
    rapidPosters: rapidPosterDetails,
    noGpsCatches: noGpsCatches.map(c => ({
      ...c,
      type: 'no_gps' as const,
    })),
    suspiciousAccounts: suspiciousAccounts.map(u => ({
      ...u,
      catchCount: u._count.catches,
    })),
    flaggedContent: flaggedContent.map(c => ({
      ...c,
      type: 'hidden' as const,
    })),
    stats: {
      totalUsersToday,
      totalCatchesToday,
    },
  };
}

export default async function ModerationPage() {
  const data = await getModerationData();
  return <ModerationClient data={data} />;
}

