import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import { getSubscriptionPeriodEnd } from '@/lib/pro-subscription';

export const dynamic = 'force-dynamic';

type CancelMode = 'period_end' | 'immediate';

// POST - Cancel PRO membership (period end or immediate)
export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      );
    }

    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json().catch(() => ({}))) as { mode?: CancelMode };
    const mode: CancelMode = body.mode === 'immediate' ? 'immediate' : 'period_end';

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        isPro: true,
        stripeSubscriptionId: true,
        proExpiresAt: true,
        proType: true,
      },
    });

    if (!user?.isPro) {
      return NextResponse.json({ error: 'No active PRO membership' }, { status: 400 });
    }

    if (!user.stripeSubscriptionId) {
      return NextResponse.json(
        {
          error:
            'This PRO membership is not billed via Stripe (e.g. referral) and cannot be cancelled here',
        },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    if (mode === 'immediate') {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isPro: false,
          proCancelAtPeriodEnd: false,
          proExpiresAt: new Date(),
          stripeSubscriptionId: null,
        },
      });

      return NextResponse.json({
        success: true,
        mode: 'immediate',
        cancelAtPeriodEnd: false,
        isPro: false,
        expiresAt: new Date().toISOString(),
      });
    }

    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    const expiresAt = getSubscriptionPeriodEnd(subscription);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        proCancelAtPeriodEnd: true,
        proExpiresAt: expiresAt,
        isPro: true,
      },
    });

    return NextResponse.json({
      success: true,
      mode: 'period_end',
      cancelAtPeriodEnd: true,
      isPro: true,
      expiresAt,
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
