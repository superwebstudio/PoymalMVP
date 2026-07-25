import prisma from "@/lib/prisma";
import { UsersClient } from "@/admin/users/UsersClient";

async function getUsersData(searchParams: { page?: string; search?: string; filter?: string }) {
  const page = parseInt(searchParams.page || '1');
  const pageSize = 20;
  const search = searchParams.search || '';
  const filter = searchParams.filter || 'all';

  const where: any = {};

  // Search filter
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
      { id: { contains: search } },
    ];
  }

  // Status filter
  if (filter === 'pro') {
    where.isPro = true;
  } else if (filter === 'free') {
    where.isPro = false;
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            catches: true,
            followers: true,
            following: true,
            referralsMade: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Calculate last active based on most recent catch
  const usersWithActivity = await Promise.all(
    users.map(async (user) => {
      const lastCatch = await prisma.catch.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

      return {
        ...user,
        lastActive: lastCatch?.createdAt || user.createdAt,
        totalCatches: user._count.catches,
        totalFollowers: user._count.followers,
        totalFollowing: user._count.following,
        totalReferrals: user._count.referralsMade,
      };
    })
  );

  return {
    users: usersWithActivity,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; filter?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const data = await getUsersData(resolvedSearchParams);

  return <UsersClient data={data} />;
}

