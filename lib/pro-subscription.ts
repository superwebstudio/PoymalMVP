import type Stripe from 'stripe';
import prisma from '@/lib/prisma';

export function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): Date {
  const itemEnd = subscription.items?.data?.[0]?.current_period_end;
  if (typeof itemEnd === 'number') {
    return new Date(itemEnd * 1000);
  }

  if (typeof subscription.cancel_at === 'number') {
    return new Date(subscription.cancel_at * 1000);
  }

  const fallback = new Date();
  fallback.setMonth(fallback.getMonth() + 1);
  return fallback;
}

export function getSubscriptionPeriodStart(subscription: Stripe.Subscription): Date {
  const itemStart = subscription.items?.data?.[0]?.current_period_start;
  if (typeof itemStart === 'number') {
    return new Date(itemStart * 1000);
  }
  return new Date(subscription.created * 1000);
}

type ActivateProParams = {
  userId: string;
  plan?: string;
  transactionId?: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  periodEnd?: Date;
  startedAt?: Date;
  cancelAtPeriodEnd?: boolean;
};

export async function activatePro(params: ActivateProParams): Promise<Date> {
  const {
    userId,
    plan = 'monthly',
    transactionId,
    stripeCustomerId,
    stripeSubscriptionId,
    periodEnd,
    startedAt,
    cancelAtPeriodEnd = false,
  } = params;

  const expirationDate = periodEnd ?? (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d;
  })();

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { proStartedAt: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      isPro: true,
      proType: plan,
      proExpiresAt: expirationDate,
      proCancelAtPeriodEnd: cancelAtPeriodEnd,
      proStartedAt: existing?.proStartedAt ?? startedAt ?? new Date(),
      ...(stripeCustomerId ? { stripeCustomerId } : {}),
      ...(stripeSubscriptionId ? { stripeSubscriptionId } : {}),
    },
  });

  if (transactionId) {
    await prisma.transaction.updateMany({
      where: { id: transactionId, status: 'pending' },
      data: { status: 'completed' },
    });
  }

  return expirationDate;
}

export async function syncSubscriptionToUser(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id;

  const periodEnd = getSubscriptionPeriodEnd(subscription);
  const isActive =
    subscription.status === 'active' ||
    subscription.status === 'trialing' ||
    subscription.status === 'past_due';

  if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isPro: periodEnd.getTime() > Date.now(),
        proExpiresAt: periodEnd,
        proCancelAtPeriodEnd: true,
        stripeSubscriptionId: null,
        ...(customerId ? { stripeCustomerId: customerId } : {}),
      },
    });
    return;
  }

  if (isActive) {
    await activatePro({
      userId,
      plan: subscription.metadata?.plan || 'monthly',
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      periodEnd,
      startedAt: getSubscriptionPeriodStart(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  }
}
