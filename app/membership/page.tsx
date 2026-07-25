"use client";

import React, { useEffect, useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { TelegramBackButton } from '@/components/TelegramBackButton';
import { Crown, Calendar, AlertTriangle, Receipt, Check } from 'lucide-react';
import { useI18n } from '@/lib/useI18n';
import { useRouter } from 'next/navigation';
import { SwipeablePage } from '@/components/SwipeablePage';
import SettingsPage from '@/app/settings/page';
import { useUserStore } from '@/stores/useUserStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

type MembershipUser = {
  id: string;
  firstName: string | null;
  isPro: boolean;
  proExpiresAt: string | null;
  proStartedAt: string | null;
  proType: string | null;
  proCancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
};

type CancelMode = 'period_end' | 'immediate';

function formatDate(value: string | Date | null | undefined, locale: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function MembershipPage() {
  const { dict, lang } = useI18n();
  const router = useRouter();
  const { userId, setCurrentUser, currentUser } = useUserStore();
  const { addNotification } = useNotificationStore();
  const [user, setUser] = useState<MembershipUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelMode, setSelectedCancelMode] = useState<CancelMode>('period_end');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!userId) {
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/user/${userId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const userData = (await response.json()) as MembershipUser & {
            catches?: unknown;
            _count?: { followers: number; following: number };
          };
          setUser({
            id: userData.id,
            firstName: userData.firstName,
            isPro: userData.isPro,
            proExpiresAt: userData.proExpiresAt,
            proStartedAt: userData.proStartedAt,
            proType: userData.proType,
            proCancelAtPeriodEnd: Boolean(userData.proCancelAtPeriodEnd),
            stripeSubscriptionId: userData.stripeSubscriptionId,
          });
          if (currentUser) {
            setCurrentUser({
              ...currentUser,
              isPro: userData.isPro,
              proType: userData.proType,
              proExpiresAt: userData.proExpiresAt ?? undefined,
              proStartedAt: userData.proStartedAt,
              proCancelAtPeriodEnd: Boolean(userData.proCancelAtPeriodEnd),
              stripeSubscriptionId: userData.stripeSubscriptionId,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchUser();
  }, [userId, setCurrentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch('/api/payment/cancel-subscription', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: selectedCancelMode }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        expiresAt?: string;
        isPro?: boolean;
        cancelAtPeriodEnd?: boolean;
      };

      if (!response.ok) {
        throw new Error(data.error || dict.cancelFailed || 'Failed to cancel subscription');
      }

      const immediate = selectedCancelMode === 'immediate';
      addNotification({
        message: immediate
          ? dict.subscriptionCancelledImmediate || 'Membership cancelled. PRO is off.'
          : dict.subscriptionCancelled ||
            'Auto-renewal turned off. PRO stays active until period end.',
        type: 'success',
      });
      setShowCancelModal(false);

      setUser((prev) =>
        prev
          ? {
              ...prev,
              isPro: immediate ? false : prev.isPro,
              proCancelAtPeriodEnd: !immediate,
              proExpiresAt: data.expiresAt ?? prev.proExpiresAt,
              stripeSubscriptionId: immediate ? null : prev.stripeSubscriptionId,
            }
          : prev
      );

      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          isPro: immediate ? false : currentUser.isPro,
          proCancelAtPeriodEnd: !immediate,
          proExpiresAt: data.expiresAt ?? currentUser.proExpiresAt,
          stripeSubscriptionId: immediate ? null : currentUser.stripeSubscriptionId,
        });
      }
    } catch (error: unknown) {
      console.error('Cancel error:', error);
      addNotification({
        message:
          error instanceof Error
            ? error.message
            : dict.cancelFailed || 'Failed to cancel subscription',
        type: 'error',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!userId || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <p className="text-zinc-400">{dict.userNotFound || 'User not found'}</p>
      </div>
    );
  }

  const expiresAt = user.proExpiresAt ? new Date(user.proExpiresAt) : null;
  const daysLeft = expiresAt
    ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;
  const canCancel =
    user.isPro &&
    Boolean(user.stripeSubscriptionId) &&
    !user.proCancelAtPeriodEnd;
  const planLabel =
    user.proType === 'yearly'
      ? dict.yearlyPlan || 'Yearly Plan'
      : user.proType === 'referral'
        ? dict.referralPlan || 'Referral'
        : dict.monthlyPlan || 'Monthly Plan';
  const benefitsUntilLabel = (
    dict.keepBenefitsUntil || 'Keep benefits until {date}'
  ).replace('{date}', formatDate(user.proExpiresAt, lang));

  return (
    <SwipeablePage
      previousPageComponent={<SettingsPage />}
      onSwipeComplete={() => router.push('/settings')}
    >
      <TelegramBackButton fallbackUrl="/settings" />

      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 sticky top-0 z-30">
        <h1 className="text-xl font-bold text-zinc-200">
          {dict.membershipManagement || 'Membership Management'}
        </h1>
      </header>

      <div className="p-4 space-y-4 pb-24">
        <div
          className={`rounded-xl p-6 ${
            user.isPro
              ? 'bg-zinc-900 border border-amber-500/30'
              : 'bg-zinc-900 border border-zinc-800'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-full ${
                  user.isPro ? 'bg-amber-500/15' : 'bg-zinc-800'
                }`}
              >
                <Crown
                  size={24}
                  className={user.isPro ? 'text-amber-400' : 'text-zinc-600'}
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {user.isPro ? (dict.proMember || 'PRO Member') : (dict.freePlan || 'Free Plan')}
                </h2>
                <p className="text-sm text-zinc-400">
                  {user.isPro ? planLabel : dict.basicFeatures || 'Basic features only'}
                </p>
              </div>
            </div>
            {user.isPro && (
              <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold tracking-wide text-amber-400">
                PRO
              </span>
            )}
          </div>

          {user.isPro && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar size={16} className="text-zinc-500" />
                <span className="text-sm">
                  {dict.purchasedOn || 'Purchased on'}:{' '}
                  <span className="text-zinc-300">{formatDate(user.proStartedAt, lang)}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar size={16} className="text-zinc-500" />
                <span className="text-sm">
                  {user.proCancelAtPeriodEnd
                    ? `${dict.expiresOn || 'Expires on'}: `
                    : `${dict.renewsOn || 'Renews on'}: `}
                  <span className="text-zinc-300">{formatDate(user.proExpiresAt, lang)}</span>
                </span>
              </div>
              {user.proCancelAtPeriodEnd && (
                <div className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-1.5 text-red-400">
                  <span className="text-sm font-medium">
                    {dict.cancelsAtPeriodEnd || 'Cancels at period end'}
                  </span>
                </div>
              )}
              {!user.proCancelAtPeriodEnd && expiresAt && (
                <div
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 ${
                    daysLeft <= 7
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <span className="text-sm font-medium">
                    {daysLeft > 0
                      ? `${daysLeft} ${dict.daysLeft || 'days left'}`
                      : dict.expired || 'Expired'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {!user.isPro && (
            <button
              type="button"
              onClick={() => router.push('/pro')}
              className="w-full flex items-center justify-between bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-4 px-6 rounded-xl transition-colors"
            >
              <span>{dict.upgradeToPro || 'Upgrade to PRO'}</span>
              <Crown size={20} />
            </button>
          )}

          <button
            type="button"
            onClick={() => router.push('/transactions')}
            className="w-full flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium py-4 px-6 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <Receipt size={20} className="text-zinc-500" />
              <span>{dict.viewTransactions || 'View Past Transactions'}</span>
            </div>
          </button>

          {canCancel && (
            <button
              type="button"
              onClick={() => {
                setSelectedCancelMode('period_end');
                setShowCancelModal(true);
              }}
              className="w-full flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-red-400 font-medium py-4 px-6 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-zinc-500" />
                <span>{dict.cancelMembership || 'Cancel membership'}</span>
              </div>
            </button>
          )}
        </div>

        {user.isPro && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h3 className="font-semibold text-zinc-200 mb-3">
              {dict.yourBenefits || 'Your PRO Benefits'}
            </h3>
            <div className="space-y-2 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>{dict.proFeature1}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>{dict.proFeature2}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>{dict.proFeature3}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={28} className="text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {dict.confirmCancellation || 'Cancel membership?'}
              </h3>
              <p className="text-zinc-400 text-sm">
                {dict.cancelWarning || 'Choose when to end PRO access.'}
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setSelectedCancelMode('period_end')}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  selectedCancelMode === 'period_end'
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-zinc-100">{benefitsUntilLabel}</div>
                    <div className="mt-1 text-xs text-amber-400">
                      {dict.recommended || 'Recommended'}
                    </div>
                  </div>
                  {selectedCancelMode === 'period_end' && (
                    <Check size={18} className="mt-0.5 shrink-0 text-amber-400" />
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCancelMode('immediate')}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  selectedCancelMode === 'immediate'
                    ? 'border-red-500/50 bg-red-500/10'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-zinc-100">
                      {dict.cancelImmediately || 'Cancel immediately'}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {dict.cancelImmediatelyWarning ||
                        'PRO turns off right away. The current period is not refunded.'}
                    </div>
                  </div>
                  {selectedCancelMode === 'immediate' && (
                    <Check size={18} className="mt-0.5 shrink-0 text-red-400" />
                  )}
                </div>
              </button>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling}
                className={`w-full font-bold py-3 rounded-lg transition-colors disabled:opacity-50 ${
                  selectedCancelMode === 'immediate'
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-zinc-100 hover:bg-white text-zinc-950'
                }`}
              >
                {isCancelling
                  ? dict.cancelling || 'Cancelling...'
                  : dict.cancelMembership || 'Cancel membership'}
              </button>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {dict.keepSubscription || 'Keep Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </SwipeablePage>
  );
}
