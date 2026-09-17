"use client";

import React, { useEffect } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { TelegramBackButton } from '@/components/TelegramBackButton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, CreditCard } from 'lucide-react';
import { useI18n } from '@/lib/useI18n';
import { useProStore } from '@/stores/useProStore';
import type { PlanType } from '@/types';
import { SwipeablePage } from '@/components/SwipeablePage';
import SettingsPage from '@/app/settings/page';
import { useUserStore } from '@/stores/useUserStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

export default function ProPage() {
    const { dict } = useI18n();
    const router = useRouter();
    const { userId } = useUserStore();
    const { addNotification } = useNotificationStore();
    const {
        currentUser,
        selectedPlan,
        isProcessing,
        setSelectedPlan,
        setIsProcessing,
        fetchUser,
        handleStripeCheckout,
    } = useProStore();

    useEffect(() => {
        if (userId) {
            fetchUser(userId);
        } else {
            useProStore.getState().setLoading(false);
        }
    }, [fetchUser, userId]);

    useEffect(() => {
        if (currentUser?.isPro && !currentUser.proCancelAtPeriodEnd) {
            router.replace('/membership');
        }
    }, [currentUser?.isPro, currentUser?.proCancelAtPeriodEnd, router]);

    const handlePlanSelect = (plan: PlanType) => {
        setSelectedPlan(plan);
    };

    const handlePayment = async () => {
        if (!selectedPlan) {
            addNotification({
                message: dict.pleaseSelectPlan || 'Please select a plan',
                type: 'info',
                position: 'center',
                showOkButton: true,
            });
            return;
        }

        if (!userId) {
            addNotification({
                message: dict.pleaseLogin || 'Please log in',
                type: 'error',
                position: 'center',
                showOkButton: true,
            });
            return;
        }

        setIsProcessing(true);
        try {
            await handleStripeCheckout(selectedPlan);
        } catch (error: unknown) {
            console.error('Payment error:', error);
            const message =
                error instanceof Error
                    ? error.message
                    : dict.paymentFailed || 'Payment failed';
            addNotification({
                message,
                type: 'error',
                position: 'center',
                showOkButton: true,
            });
            setIsProcessing(false);
        }
    };

    const features = [
        dict.proFeature1,
        dict.proFeature2,
        dict.proFeature3,
    ];

    return (
        <SwipeablePage
            previousPageComponent={<SettingsPage />}
            onSwipeComplete={() => router.push('/settings')}
        >
            <TelegramBackButton />

            <div className="p-4 space-y-6 pt-6">
                {/* Hero Section */}
                <div className="rounded-2xl p-6 text-center">
                    <div className="mb-8 flex items-center justify-center">
                        <Link href="/" aria-label="Poymal home" className="inline-block">
                            <img src="/logo-max.svg" alt="Poymal" />
                        </Link>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2 mx-auto mt-8">
                        <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 bg-clip-text text-transparent">PRO</span>
                    </h2>
                    <p className="text-zinc-400">
                        {dict.proDescription}
                    </p>
                </div>

                {/* Features List */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <h3 className="font-bold text-lg mb-4 text-zinc-200">{dict.whatsIncluded}</h3>
                    <div className="space-y-3">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <Check className="text-blue-400" size={16} />
                                </div>
                                <span className="text-zinc-300">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pricing Card */}
                <div className="space-y-3">
                    <h3 className="font-bold text-lg text-zinc-200">{dict.chooseYourPlan}</h3>
                    <button
                        type="button"
                        onClick={() => handlePlanSelect('monthly')}
                        className={`w-full bg-zinc-900 border-2 rounded-xl p-3 text-left transition-all h-[100px] flex flex-col justify-between ${selectedPlan === 'monthly'
                            ? 'border-white/30 bg-zinc-800 scale-[1.02]'
                            : 'border-zinc-800 hover:border-white/20'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <div className="font-bold text-lg text-zinc-100">{dict.monthly}</div>
                                <div className="text-sm text-zinc-500">{dict.billedMonthly}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-zinc-100">€4.99</div>
                                <div className="text-xs text-zinc-500">
                                    {dict.perMonth}
                                </div>
                            </div>
                        </div>
                    </button>
                </div>

                {selectedPlan && (
                    <div className="space-y-3">
                        <h3 className="font-bold text-lg text-zinc-200">{dict.paymentMethod}</h3>

                        <div className="p-4 rounded-xl border-2 border-blue-500 bg-blue-500/10">
                            <div className="flex flex-col items-center gap-2">
                                <CreditCard className="text-blue-400" size={24} />
                                <span className="text-sm font-medium text-zinc-200">{dict.payWithStripe}</span>
                                <span className="text-xs text-zinc-500">{dict.stripeSecureCheckout}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handlePayment}
                            disabled={isProcessing}
                            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (dict.loading || 'Processing...') : (dict.buyPro || 'Buy PRO')}
                        </button>
                    </div>
                )}

                {/* Current Status */}
                {currentUser?.isPro ? (
                    <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 text-center">
                        <Check className="text-green-400 mx-auto mb-2" size={32} />
                        <p className="font-semibold text-green-400">{dict.alreadyProMember}</p>
                        {currentUser.proExpiresAt && (
                            <p className="text-sm text-zinc-400 mt-1">
                                {dict.expires} {new Date(currentUser.proExpiresAt).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <div className="text-sm text-zinc-400 text-center">
                            {dict.paymentProcessedSecurely}
                        </div>
                    </div>
                )}
            </div>
            <BottomNav />
        </SwipeablePage>
    );
}
