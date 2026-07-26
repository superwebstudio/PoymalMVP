import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import {
  activatePro,
  getSubscriptionPeriodEnd,
  getSubscriptionPeriodStart,
} from '@/lib/pro-subscription';

export const dynamic = 'force-dynamic';

// POST - Confirm Stripe Checkout session and activate PRO (success-page fallback)
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

    const body = (await request.json()) as { sessionId?: string };
    if (!body.sessionId || typeof body.sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(body.sessionId);
    const userId =
      session.metadata?.userId || session.client_reference_id || undefined;

    if (!userId || userId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
    }

    const plan = session.metadata?.plan || 'monthly';
    const transactionId = session.metadata?.transactionId;
    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;
    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

    let periodEnd: Date | undefined;
    let startedAt: Date | undefined;
    let cancelAtPeriodEnd = false;

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      periodEnd = getSubscriptionPeriodEnd(subscription);
      startedAt = getSubscriptionPeriodStart(subscription);
      cancelAtPeriodEnd = subscription.cancel_at_period_end;
    }

    const expiresAt = await activatePro({
      userId,
      plan,
      transactionId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      periodEnd,
      startedAt,
      cancelAtPeriodEnd,
    });

    return NextResponse.json({ success: true, plan, expiresAt });
  } catch (error) {
    console.error('Confirm Stripe session error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
