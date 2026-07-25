import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const REFERRAL_PREMIUM_DAYS = 7;

// POST - Complete a referral when user posts their first catch
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { userId } = auth;

    const referral = await prisma.referral.findUnique({
      where: { referredUserId: userId },
    });

    if (!referral) {
      return NextResponse.json({ success: true, noReferral: true });
    }

    if (referral.status !== 'pending') {
      return NextResponse.json({ success: true, alreadyProcessed: true });
    }

    if (new Date() > referral.expiresAt) {
      await prisma.referral.update({
        where: { id: referral.id },
        data: { status: 'expired' },
      });
      return NextResponse.json({ success: true, expired: true });
    }

    const referrer = await prisma.user.findUnique({
      where: { id: referral.referrerUserId },
      select: { totalCompletedReferrals: true },
    });

    if (!referrer) {
      return NextResponse.json({ error: 'Referrer not found' }, { status: 404 });
    }

    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'completed',
        firstPostAt: new Date(),
        rewardClaimed: true,
        daysAwarded: REFERRAL_PREMIUM_DAYS,
      },
    });

    // Referrer: 7 Premium days + 1 prize-draw entry per successful referral
    await prisma.user.update({
      where: { id: referral.referrerUserId },
      data: {
        totalCompletedReferrals: { increment: 1 },
        premiumDaysBalance: { increment: REFERRAL_PREMIUM_DAYS },
        raffleTickets: { increment: 1 },
      },
    });

    const referredUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { proExpiresAt: true, firstName: true, username: true },
    });

    const referredUserName = referredUser?.firstName || referredUser?.username || 'Друг';

    const now = new Date();
    const currentExpiry =
      referredUser?.proExpiresAt && referredUser.proExpiresAt > now
        ? referredUser.proExpiresAt
        : now;
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + REFERRAL_PREMIUM_DAYS);

    await prisma.user.update({
      where: { id: userId },
      data: {
        isPro: true,
        proExpiresAt: newExpiry,
        proType: 'referral',
      },
    });

    await prisma.notification.create({
      data: {
        userId: referral.referrerUserId,
        type: 'referral_completed',
        actorId: userId,
        content: `🎉 ${referredUserName} поймал свою первую рыбу!\n\nВы оба получили +${REFERRAL_PREMIUM_DAYS} дней Премиума`,
      },
    });

    return NextResponse.json({
      success: true,
      referredUserDays: REFERRAL_PREMIUM_DAYS,
      referrerDays: REFERRAL_PREMIUM_DAYS,
      referrerRaffleTicket: true,
      message: `Referral completed! You both earned ${REFERRAL_PREMIUM_DAYS} days Premium.`,
    });
  } catch (error) {
    console.error('Complete referral error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
