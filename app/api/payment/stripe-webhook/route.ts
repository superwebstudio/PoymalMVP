import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import {
  activatePro,
  getSubscriptionPeriodEnd,
  getSubscriptionPeriodStart,
  syncSubscriptionToUser,
} from '@/lib/pro-subscription';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe webhook is not configured' },
      { status: 503 }
    );
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId =
        session.metadata?.userId || session.client_reference_id || undefined;
      const plan = session.metadata?.plan || 'monthly';
      const transactionId = session.metadata?.transactionId;

      if (userId && (session.payment_status === 'paid' || session.status === 'complete')) {
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

        await activatePro({
          userId,
          plan,
          transactionId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          periodEnd,
          startedAt,
          cancelAtPeriodEnd,
        });
      }
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      const parentSub = invoice.parent?.subscription_details?.subscription;
      const subscriptionId =
        typeof parentSub === 'string' ? parentSub : parentSub?.id;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata?.userId;
        const plan = subscription.metadata?.plan || 'monthly';
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id;

        if (userId) {
          await activatePro({
            userId,
            plan,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            periodEnd: getSubscriptionPeriodEnd(subscription),
            startedAt: getSubscriptionPeriodStart(subscription),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });
        }
      }
    }

    if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscriptionToUser(subscription);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
