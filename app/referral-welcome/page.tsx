"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/lib/useI18n';
import { useUserStore } from '@/stores/useUserStore';
import { ArrowRight, Gift } from 'lucide-react';

interface ReferralWelcomeProps {
    referrerName: string;
    referralCode: string;
}

export default function ReferralWelcomePage() {
    const router = useRouter();
    const { dict } = useI18n();
    const { userId } = useUserStore();
    const [screen, setScreen] = useState<1 | 2>(1);
    const [referrerName, setReferrerName] = useState<string>('');
    const [referralCode, setReferralCode] = useState<string>('');

    useEffect(() => {
        // Read the referral captured by the standalone web join flow.
        const checkReferral = async () => {
            const storedCode = localStorage.getItem('referral_code');
            if (storedCode) {
                setReferralCode(storedCode);
                try {
                    const response = await fetch(`/api/referral/info?code=${storedCode}`);
                    if (response.ok) {
                        const data = await response.json();
                        setReferrerName(data.referrerName || 'Friend');
                    } else {
                        setReferrerName('Friend');
                    }
                } catch {
                    setReferrerName('Friend');
                }
            } else {
                // No referral, skip to language selection
                router.push('/language-select');
            }
        };

        checkReferral();
    }, [router]);

    const handleProceed = () => {
        if (screen === 1) {
            setScreen(2);
        } else {
            // Store referral code and proceed to language selection
            if (referralCode && typeof localStorage !== 'undefined') {
                localStorage.setItem('referral_code', referralCode);
            }
            router.push('/language-select');
        }
    };

    if (!referrerName) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-950">
                <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-md space-y-8">
                    {/* Logo */}
                    <div className="text-center">
                        <Link href="/" className="inline-block" aria-label="Poymal home">
                            <img
                                src="/logo-max.svg"
                                alt="Poymal"
                                className="mx-auto mb-6 h-16"
                            />
                        </Link>
                    </div>

                    {screen === 1 ? (
                        // Screen 1: Invitation acknowledgment
                        <>
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Gift size={40} className="text-sky-400" />
                                </div>
                                <h1 className="text-2xl font-bold text-white">
                                    {dict.referralWelcome || 'You\'ve been invited!'}
                                </h1>
                                <p className="text-zinc-400 text-lg">
                                    {dict.referralInvitedBy || 'You\'ve been invited by'} <span className="text-sky-400 font-semibold">{referrerName}</span>
                                </p>
                            </div>

                            <button
                                onClick={handleProceed}
                                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {dict.proceed || 'Proceed'}
                                <ArrowRight size={20} />
                            </button>
                        </>
                    ) : (
                        // Screen 2: Rewards & sharing
                        <>
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Gift size={40} className="text-yellow-400" />
                                </div>
                                <h1 className="text-2xl font-bold text-white">
                                    {dict.referralRewardTitle || 'You got 7 days of Premium!'}
                                </h1>
                                <p className="text-zinc-400">
                                    {dict.referralRewardMessage || 'Post your first catch within 7 days to unlock your reward. Invite others to earn even more Premium days!'}
                                </p>
                            </div>

                            <button
                                onClick={handleProceed}
                                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {dict.continue || 'Continue'}
                                <ArrowRight size={20} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

