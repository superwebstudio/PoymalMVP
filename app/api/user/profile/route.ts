import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  AUTH_LIMIT,
  addRateLimitHeaders,
  checkRateLimit,
  rateLimitResponse,
} from '@/lib/rate-limit';

const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(
      /^[a-z0-9_]+$/,
      'Use only lowercase letters, numbers, and underscores',
    )
    .optional(),
  photoUrl: z
    .union([
      z.string().trim().url().max(2048),
      z.string().trim().regex(/^\/uploads\/.+/).max(2048),
    ])
    .nullable()
    .optional(),
  firstName: z.string().trim().min(1).max(50).nullable().optional(),
});

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rateLimit = checkRateLimit(`${auth.userId}:profile`, AUTH_LIMIT);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const parsed = profileSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid profile details' },
        { status: 400 },
      );
    }

    if (
      parsed.data.username === undefined &&
      parsed.data.photoUrl === undefined &&
      parsed.data.firstName === undefined
    ) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    if (parsed.data.username) {
      const existing = await prisma.user.findFirst({
        where: {
          username: {
            equals: parsed.data.username,
            mode: 'insensitive',
          },
          id: { not: auth.userId },
        },
        select: { id: true },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'That username is already taken' },
          { status: 409 },
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        ...(parsed.data.username !== undefined && { username: parsed.data.username }),
        ...(parsed.data.photoUrl !== undefined && { photoUrl: parsed.data.photoUrl }),
        ...(parsed.data.firstName !== undefined && { firstName: parsed.data.firstName }),
      },
      select: {
        id: true,
        firstName: true,
        username: true,
        photoUrl: true,
        language: true,
        isPro: true,
        country: true,
        proType: true,
      },
    });

    const response = NextResponse.json({ success: true, user });
    return addRateLimitHeaders(response, rateLimit);
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'That username is already taken' },
        { status: 409 },
      );
    }

    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Unable to update profile' },
      { status: 500 },
    );
  }
}
