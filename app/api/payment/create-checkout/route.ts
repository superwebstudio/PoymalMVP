import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { PRO_MONTHLY_AMOUNT_CENTS, PRO_MONTHLY_CURRENCY, stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

function appBaseUrl(request: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    request.nextUrl.origin ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

// POST - Create Stripe Checkout session for PRO monthly (€4.99)
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
    const { userId } = auth;

    const body = (await request.json().catch(() => ({}))) as { plan?: string };
    const plan = body.plan || 'monthly';

    if (plan !== 'monthly') {
      return NextResponse.json(
        { error: 'Only monthly plan is supported' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        stripeCustomerId: true,
        isPro: true,
        proCancelAtPeriodEnd: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.isPro && user.stripeSubscriptionId && !user.proCancelAtPeriodEnd) {
      return NextResponse.json(
        { error: 'You already have an active PRO subscription' },
        { status: 409 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount: PRO_MONTHLY_AMOUNT_CENTS / 100,
        currency: PRO_MONTHLY_CURRENCY,
        type: 'monthly',
        status: 'pending',
      },
    });

    const baseUrl = appBaseUrl(request);
    const priceId = process.env.STRIPE_PRICE_ID_MONTHLY;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      ...(user.stripeCustomerId
        ? { customer: user.stripeCustomerId }
        : { customer_email: user.email || undefined }),
      client_reference_id: userId,
      line_items: [
        priceId
          ? { price: priceId, quantity: 1 }
          : {
              price_data: {
                currency: PRO_MONTHLY_CURRENCY,
                unit_amount: PRO_MONTHLY_AMOUNT_CENTS,
                recurring: { interval: 'month' },
                product_data: {
                  name: 'Ulov PRO',
                  description: 'Monthly PRO membership',
                },
              },
              quantity: 1,
            },
      ],
      success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pro`,
      metadata: {
        userId,
        plan: 'monthly',
        transactionId: transaction.id,
      },
      subscription_data: {
        metadata: {
          userId,
          plan: 'monthly',
          transactionId: transaction.id,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { invoiceUrl: session.url },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error('Create checkout error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
