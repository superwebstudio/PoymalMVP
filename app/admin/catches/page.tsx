export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import { CatchesClient } from "@/admin/catches/CatchesClient";

async function getCatchesData(searchParams: { page?: string; search?: string; filter?: string }) {
  const page = parseInt(searchParams.page || '1');
  const pageSize = 20;
  const search = searchParams.search || '';
  const filter = searchParams.filter || 'all';

  const where: any = {};

  // Search filter
  if (search) {
    where.OR = [
      { species: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Visibility filter
  if (filter === 'public') {
    where.isPublic = true;
  } else if (filter === 'private') {
    where.isPublic = false;
  } else if (filter === 'text') {
    where.isTextOnly = true;
  }

  const [catches, totalCount] = await Promise.all([
    prisma.catch.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
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
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    }),
    prisma.catch.count({ where }),
  ]);

  // Get total stats
  const totalCatches = await prisma.catch.count();
  const publicCatches = await prisma.catch.count({ where: { isPublic: true } });
  const privateCatches = await prisma.catch.count({ where: { isPublic: false } });
  const textOnlyCatches = await prisma.catch.count({ where: { isTextOnly: true } });

  return {
    catches: catches.map(c => ({
      ...c,
      likesCount: c._count.likes,
      commentsCount: c._count.comments,
    })),
    stats: {
      total: totalCatches,
      public: publicCatches,
      private: privateCatches,
      textOnly: textOnlyCatches,
    },
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
}

export default async function CatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; filter?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const data = await getCatchesData(resolvedSearchParams);

  return <CatchesClient data={data} />;
}

