"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/useI18n';
import { motion } from 'framer-motion';
import { useProStore } from '@/stores/useProStore';

function PaymentSuccessContent() {
  const { dict } = useI18n();
  const searchParams = useSearchParams();
  const confirmStripeSession = useProStore((s) => s.confirmStripeSession);
  const [showContent, setShowContent] = useState(false);
  const [confirming, setConfirming] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const sessionId = searchParams.get('session_id');
      if (sessionId) {
        await confirmStripeSession(sessionId);
      }
      if (!cancelled) {
        setConfirming(false);
        setShowContent(true);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [confirmStripeSession, searchParams]);

  if (confirming) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-zinc-400">{dict.loading || 'Loading...'}</p>
      </div>
    );
  }

  return (
    <motion.div className="flex-1 relative z-10 flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-md space-y-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: showContent ? 1 : 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.2,
          }}
          className="relative mx-auto w-32 h-32"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: showContent ? 1 : 0 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.6,
              }}
            >
              <Check size={64} className="text-white" strokeWidth={3} />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: showContent ? [0, 1, 0] : 0,
              scale: showContent ? [0.8, 1.2, 1] : 0,
            }}
            transition={{ duration: 1, delay: 0.8 }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles size={24} className="text-yellow-400" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: showContent ? [0, 1, 0] : 0,
              scale: showContent ? [0.8, 1.2, 1] : 0,
            }}
            transition={{ duration: 1, delay: 1 }}
            className="absolute -bottom-2 -left-2"
          >
            <Sparkles size={20} className="text-orange-400" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="space-y-4"
        >
          <h1 className="text-3xl font-bold text-white">
            {dict.paymentSuccess || 'Payment Successful!'}
          </h1>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-full">
            <Sparkles size={20} className="text-yellow-400" />
            <span className="text-yellow-400 font-bold">
              {dict.welcomeToPro || 'Welcome to PRO!'}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 text-left"
        >
          <h3 className="text-lg font-semibold text-center text-zinc-200">
            {dict.nowYouCanEnjoy || 'Now you can enjoy:'}
          </h3>
          <div className="space-y-3">
            {[
              dict.proFeature1 || 'Unlimited AI identification',
              dict.proFeature2 || 'Ad-free experience',
              dict.proFeature3 || 'PRO badge on profile',
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: showContent ? 1 : 0,
                  x: showContent ? 0 : -20,
                }}
                transition={{ duration: 0.3, delay: 1.4 + index * 0.1 }}
                className="flex items-center gap-3 text-zinc-300"
              >
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check size={14} className="text-green-400" />
                </div>
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 1.8 }}
          className="space-y-3"
        >
          <Link
            href="/profile"
            className="block w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 rounded-xl transition-colors"
          >
            {dict.goToProfile || 'Go to Profile'}
          </Link>
          <Link
            href="/"
            className="block w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium py-4 rounded-xl transition-colors"
          >
            {dict.backToHome || 'Back to Home'}
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div
      className="fixed inset-0 flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden pb-[max(0px,env(safe-area-inset-bottom))]"
    >
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-zinc-400">Loading...</p>
          </div>
        }
      >
        <PaymentSuccessContent />
      </Suspense>
    </div>
  );
}
