"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useI18n } from '@/lib/useI18n';
import { Check, Loader2 } from 'lucide-react';
import { useUserStore } from '@/stores/useUserStore';

export default function PaymentVerifyPage() {
  const { dict } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userId } = useUserStore();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const transactionId = searchParams.get('transactionId');

  useEffect(() => {
    if (!transactionId) {
      setStatus('failed');
      return;
    }

    // Poll for payment status
    const verifyPayment = async () => {
      try {
        if (!userId) {
          setStatus('failed');
          return;
        }

        const response = await fetch(`/api/payment/status?transactionId=${transactionId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'completed') {
            setStatus('success');
            setTimeout(() => {
              router.push('/payment-success');
            }, 2000);
          } else if (data.status === 'failed') {
            setStatus('failed');
          } else {
            // Still pending, check again
            setTimeout(verifyPayment, 3000);
          }
        } else {
          setStatus('failed');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('failed');
      }
    };

    verifyPayment();
  }, [transactionId, router, userId]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">{(dict as any).verifyingPayment || 'Verifying payment...'}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <Check className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-green-400 font-semibold">{(dict as any).paymentVerified || 'Payment verified!'}</p>
            <p className="text-zinc-400 text-sm mt-2">{(dict as any).redirecting || 'Redirecting...'}</p>
          </>
        )}
        {status === 'failed' && (
          <>
            <p className="text-red-400 font-semibold">{(dict as any).paymentVerificationFailed || 'Payment verification failed'}</p>
            <button
              onClick={() => router.push('/pro')}
              className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg"
            >
              {(dict as any).backToPro || 'Back to PRO'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

