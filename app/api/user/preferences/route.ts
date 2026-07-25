import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { userPreferencesSchema, validateBody, formatZodError } from '@/lib/validations';
import { checkRateLimit, rateLimitResponse, STANDARD_LIMIT } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId } = auth;

    const rateLimit = checkRateLimit(userId, STANDARD_LIMIT);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const body = await req.json();

    const validation = validateBody(userPreferencesSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: formatZodError(validation.error) }, { status: 400 });
    }

    const {
      showTelegramHandle,
      showCountryBadge,
      notificationsEnabled,
      notifyOnLikes,
      notifyOnComments,
    } = validation.data;

    const updateData: Record<string, unknown> = {};

    if (showTelegramHandle !== undefined) {
      updateData.showTelegramHandle = showTelegramHandle;
    }
    if (showCountryBadge !== undefined) {
      updateData.showCountryBadge = showCountryBadge;
    }
    if (notificationsEnabled !== undefined) {
      updateData.notificationsEnabled = notificationsEnabled;
    }
    if (notifyOnLikes !== undefined) {
      updateData.notifyOnLikes = notifyOnLikes;
    }
    if (notifyOnComments !== undefined) {
      updateData.notifyOnComments = notifyOnComments;
    }

    const country = body.country;
    if (country !== undefined) {
      updateData.country = country === '' ? null : country;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        showTelegramHandle: true,
        showCountryBadge: true,
        country: true,
        notificationsEnabled: true,
        notifyOnLikes: true,
        notifyOnComments: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: unknown) {
    console.error('Error updating user preferences:', error);
    const err = error as { message?: string; code?: string };
    return NextResponse.json(
      {
        error: err?.message || 'Internal Server Error',
        code: err?.code || 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}
