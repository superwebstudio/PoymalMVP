"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Fish, Clock, CheckCircle } from 'lucide-react';
import { useUserStore } from '@/stores/useUserStore';
import { useI18n } from '@/lib/useI18n';

export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const { dict } = useI18n();
  const { userId } = useUserStore();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState<string>('A friend');
  const [status, setStatus] = useState<'loading' | 'ready' | 'registered' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params;
      const code = resolvedParams.code;
      setReferralCode(code);

      // Store referral code in localStorage for after signup
      if (typeof window !== 'undefined') {
        localStorage.setItem('referral_code', code);
      }

      // If user is already logged in, register the referral
      if (userId) {
        try {
          const response = await fetch('/api/referral', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              referralCode: code,
              referredUserId: userId,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setReferrerName(data.referrerName);
            setStatus('registered');
            // Redirect to home after showing success
            setTimeout(() => router.push('/'), 3000);
          } else {
            const error = await response.json();
            if (error.error === 'User already has a referral') {
              setStatus('error');
              setErrorMessage(dict.alreadyReferred || 'You have already been referred');
            } else {
              setStatus('error');
              setErrorMessage(error.error || 'Invalid referral link');
            }
          }
        } catch (error) {
          setStatus('error');
          setErrorMessage('Failed to process referral');
        }
      } else {
        setStatus('ready');
      }
    };

    init();
  }, [params, userId, router, dict]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full opacity-20 animate-pulse" />
          <div className="absolute inset-2 bg-zinc-900 rounded-full flex items-center justify-center">
            <Gift size={40} className="text-yellow-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white">
          {dict.youveBeenInvited || "You've been invited!"}
        </h1>

        {status === 'registered' ? (
          <>
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
              <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
              <p className="text-green-400">
                {dict.referralRegistered || 'Referral registered successfully!'}
              </p>
            </div>
            <p className="text-zinc-400">
              {dict.postFirstCatchToEarn || 'Post your first catch within 7 days to earn 7 days free Premium!'}
            </p>
          </>
        ) : status === 'error' ? (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-400">{errorMessage}</p>
          </div>
        ) : (
          <>
            <p className="text-zinc-400 text-lg">
              <span className="text-yellow-500 font-semibold">{referrerName}</span>{' '}
              {dict.invitedYouToJoin || 'invited you to join Ulov'}
            </p>

            {/* Benefits */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                {dict.whatYoullGet || "What you'll get:"}
              </h3>
              
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-sky-500/20 rounded-lg">
                  <Fish size={20} className="text-sky-400" />
                </div>
                <div>
                  <p className="text-white font-medium">+2 {dict.daysPremium || 'days Premium'}</p>
                  <p className="text-xs text-zinc-500">{dict.whenYouPostFirstCatch || 'When you post your first catch'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock size={20} className="text-yellow-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{dict.sevenDaysToPost || '7 days to post'}</p>
                  <p className="text-xs text-zinc-500">{dict.postWithinWindow || 'Post within the window to earn rewards'}</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-sky-900/30"
            >
              {dict.joinNow || 'Join Now'}
            </button>

            <p className="text-xs text-zinc-500">
              {dict.referralCodeSaved || 'Your referral will be registered when you sign in'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

