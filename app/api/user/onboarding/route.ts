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

const onboardingSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(
      /^[a-z0-9_]+$/,
      'Use only lowercase letters, numbers, and underscores',
    ),
  language: z.enum(['en', 'ru']),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rateLimit = checkRateLimit(`${auth.userId}:onboarding`, AUTH_LIMIT);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const parsed = onboardingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid profile details' },
        { status: 400 },
      );
    }

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

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        username: parsed.data.username,
        language: parsed.data.language,
      },
      select: {
        id: true,
        username: true,
        language: true,
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

    console.error('Onboarding update error:', error);
    return NextResponse.json(
      { error: 'Unable to save your profile' },
      { status: 500 },
    );
  }
}
