import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AI_LIMIT, checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

const FREE_MONTHLY_AI_LIMIT = 1;

export type AiGateSuccess = {
  ok: true;
  userId: string;
  isPro: boolean;
};

export type AiGateFailure = {
  ok: false;
  response: NextResponse;
};

/**
 * Free accounts get one identification per calendar month.
 * The counter resets when lastAiReset is at least one month old; PRO skips the cap.
 * A short rate limit still applies to every tier so a single session cannot stampede the model.
 */
export async function assertAiIdentifyAllowed(
  userId: string
): Promise<AiGateSuccess | AiGateFailure> {
  const rateLimit = checkRateLimit(userId, AI_LIMIT);
  if (!rateLimit.success) {
    return { ok: false, response: rateLimitResponse(rateLimit) };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isPro: true, aiUsageCount: true, lastAiReset: true },
  });

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'User not found' }, { status: 404 }),
    };
  }

  if (!user.isPro) {
    const now = new Date();
    const lastReset = user.lastAiReset;
    const monthsSinceReset = lastReset
      ? (now.getFullYear() - lastReset.getFullYear()) * 12 +
        (now.getMonth() - lastReset.getMonth())
      : 1;

    let usageCount = user.aiUsageCount;
    if (monthsSinceReset >= 1) {
      await prisma.user.update({
        where: { id: userId },
        data: { aiUsageCount: 0, lastAiReset: now },
      });
      usageCount = 0;
    } else if (usageCount >= FREE_MONTHLY_AI_LIMIT) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error:
              'Monthly AI limit reached. Upgrade to PRO for unlimited identifications.',
            code: 'AI_LIMIT_EXCEEDED',
          },
          { status: 403 }
        ),
      };
    }
  }

  return { ok: true, userId: user.id, isPro: user.isPro };
}

export async function recordAiUsage(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { aiUsageCount: { increment: 1 } },
  });
}
