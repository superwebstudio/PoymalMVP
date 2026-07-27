import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

type LeaderboardRow = {
  id: string;
  firstName: string | null;
  username: string | null;
  photoUrl: string | null;
  isPro: boolean;
  country: string | null;
  score: number | string;
  totalWeight?: number;
  _count: {
    catches: number;
    followers: number;
  };
};

type RawUserScore = {
  id: string;
  firstName: string | null;
  username: string | null;
  photoUrl: string | null;
  isPro: boolean;
  country: string | null;
  score: number | string;
  totalWeight?: number;
  catchCount: number;
};

async function attachFollowerCounts(rows: RawUserScore[]): Promise<LeaderboardRow[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const followerGroups = await prisma.follow.groupBy({
    by: ['followingId'],
    where: { followingId: { in: ids } },
    _count: { _all: true },
  });
  const followersByUser = new Map(
    followerGroups.map((group) => [group.followingId, group._count._all]),
  );

  return rows.map((row) => ({
    id: row.id,
    firstName: row.firstName,
    username: row.username,
    photoUrl: row.photoUrl,
    isPro: row.isPro,
    country: row.country,
    score: row.score,
    totalWeight: row.totalWeight,
    _count: {
      catches: row.catchCount,
      followers: followersByUser.get(row.id) ?? 0,
    },
  }));
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'total';

    if (category === 'species') {
      const rows = await prisma.$queryRaw<
        Array<{
          id: string;
          firstName: string | null;
          username: string | null;
          photoUrl: string | null;
          isPro: boolean;
          country: string | null;
          score: number;
          catchCount: number;
        }>
      >(Prisma.sql`
        SELECT
          u.id,
          u."firstName",
          u.username,
          u."photoUrl",
          u."isPro",
          u.country,
          COUNT(DISTINCT c.species)::int AS score,
          COUNT(c.id)::int AS "catchCount"
        FROM "User" u
        INNER JOIN "Catch" c ON c."userId" = u.id
        WHERE c.species IS NOT NULL AND c.species <> ''
        GROUP BY u.id
        ORDER BY score DESC
        LIMIT 50
      `);

      return NextResponse.json(await attachFollowerCounts(rows));
    }

    // "streak" category is used as longest fish by length (UI: "По длине")
    if (category === 'streak') {
      const rows = await prisma.$queryRaw<
        Array<{
          id: string;
          firstName: string | null;
          username: string | null;
          photoUrl: string | null;
          isPro: boolean;
          country: string | null;
          score: number;
          catchCount: number;
        }>
      >(Prisma.sql`
        SELECT
          u.id,
          u."firstName",
          u.username,
          u."photoUrl",
          u."isPro",
          u.country,
          COALESCE(MAX(c.length), 0)::float AS score,
          COUNT(c.id)::int AS "catchCount"
        FROM "User" u
        INNER JOIN "Catch" c ON c."userId" = u.id
        WHERE c.length IS NOT NULL AND c.length > 0
        GROUP BY u.id
        ORDER BY score DESC
        LIMIT 50
      `);

      return NextResponse.json(
        await attachFollowerCounts(
          rows.map((row) => ({
            ...row,
            score: Number(row.score || 0).toFixed(0),
          })),
        ),
      );
    }

    if (category === 'following') {
      const auth = await verifyAuth(req);
      if (!auth.success) {
        return NextResponse.json([]);
      }

      const rows = await prisma.$queryRaw<
        Array<{
          id: string;
          firstName: string | null;
          username: string | null;
          photoUrl: string | null;
          isPro: boolean;
          country: string | null;
          totalWeight: number;
          catchCount: number;
        }>
      >(Prisma.sql`
        SELECT
          u.id,
          u."firstName",
          u.username,
          u."photoUrl",
          u."isPro",
          u.country,
          COALESCE(SUM(c.weight), 0)::float AS "totalWeight",
          COUNT(c.id)::int AS "catchCount"
        FROM "User" u
        INNER JOIN "Follow" f ON f."followingId" = u.id AND f."followerId" = ${auth.userId}
        LEFT JOIN "Catch" c ON c."userId" = u.id
        GROUP BY u.id
        HAVING COALESCE(SUM(c.weight), 0) > 0
        ORDER BY "totalWeight" DESC
        LIMIT 50
      `);

      return NextResponse.json(
        await attachFollowerCounts(
          rows.map((row) => ({
            ...row,
            score: Number(row.totalWeight || 0).toFixed(1),
            totalWeight: Number(row.totalWeight || 0),
          })),
        ),
      );
    }

    if (category === 'country') {
      const country = searchParams.get('country');
      if (!country) {
        return NextResponse.json([]);
      }

      const rows = await prisma.$queryRaw<
        Array<{
          id: string;
          firstName: string | null;
          username: string | null;
          photoUrl: string | null;
          isPro: boolean;
          country: string | null;
          totalWeight: number;
          catchCount: number;
        }>
      >(Prisma.sql`
        SELECT
          u.id,
          u."firstName",
          u.username,
          u."photoUrl",
          u."isPro",
          u.country,
          COALESCE(SUM(c.weight), 0)::float AS "totalWeight",
          COUNT(c.id)::int AS "catchCount"
        FROM "User" u
        LEFT JOIN "Catch" c ON c."userId" = u.id
        WHERE u.country = ${country}
        GROUP BY u.id
        HAVING COALESCE(SUM(c.weight), 0) > 0
        ORDER BY "totalWeight" DESC
        LIMIT 50
      `);

      return NextResponse.json(
        await attachFollowerCounts(
          rows.map((row) => ({
            ...row,
            score: Number(row.totalWeight || 0).toFixed(1),
            totalWeight: Number(row.totalWeight || 0),
          })),
        ),
      );
    }

    // Default: total weight
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        firstName: string | null;
        username: string | null;
        photoUrl: string | null;
        isPro: boolean;
        country: string | null;
        totalWeight: number;
        catchCount: number;
      }>
    >(Prisma.sql`
      SELECT
        u.id,
        u."firstName",
        u.username,
        u."photoUrl",
        u."isPro",
        u.country,
        COALESCE(SUM(c.weight), 0)::float AS "totalWeight",
        COUNT(c.id)::int AS "catchCount"
      FROM "User" u
      LEFT JOIN "Catch" c ON c."userId" = u.id
      GROUP BY u.id
      HAVING COALESCE(SUM(c.weight), 0) > 0
      ORDER BY "totalWeight" DESC
      LIMIT 50
    `);

    return NextResponse.json(
      await attachFollowerCounts(
        rows.map((row) => ({
          ...row,
          score: Number(row.totalWeight || 0).toFixed(1),
          totalWeight: Number(row.totalWeight || 0),
        })),
      ),
    );
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
