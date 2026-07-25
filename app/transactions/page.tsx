"use client";

import React, { useEffect, useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { TelegramBackButton } from '@/components/TelegramBackButton';
import { Receipt, Calendar, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { useI18n } from '@/lib/useI18n';
import { useUserStore } from '@/stores/useUserStore';
import { SwipeablePage } from '@/components/SwipeablePage';
import MembershipPage from '@/app/membership/page';
import { useRouter } from 'next/navigation';

type Transaction = {
  id: string;
  date: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  invoiceUrl?: string | null;
};

function formatAmount(amount: number, currency: string): string {
  const normalized = currency.toLowerCase();
  if (normalized === 'eur') {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }
  if (normalized === 'stars') {
    return `${amount} ⭐`;
  }
  return `${amount} ${currency.toUpperCase()}`;
}

export default function TransactionsPage() {
  const { dict, lang } = useI18n();
  const router = useRouter();
  const { userId } = useUserStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        if (!userId) {
          setLoading(false);
          return;
        }

        const response = await fetch('/api/payment/transactions', {
          credentials: 'include',
        });
        if (!response.ok) {
          setTransactions([]);
          return;
        }

        const data = (await response.json()) as { transactions?: Transaction[] };
        setTransactions(data.transactions ?? []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchTransactions();
  }, [userId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} className="text-green-400" />;
      case 'failed':
        return <XCircle size={20} className="text-red-400" />;
      case 'pending':
        return (
          <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return dict.completed || 'Completed';
      case 'failed':
        return dict.failed || 'Failed';
      case 'pending':
        return dict.pending || 'Pending';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-zinc-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">{dict.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <SwipeablePage
      previousPageComponent={<MembershipPage />}
      onSwipeComplete={() => router.push('/membership')}
    >
      <TelegramBackButton fallbackUrl="/membership" />

      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Receipt size={24} className="text-zinc-400" />
          <h1 className="text-xl font-bold text-zinc-200">
            {dict.transactions || 'Transactions'}
          </h1>
        </div>
      </header>

      <main className="flex-1 p-4 pb-24">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              <Receipt size={32} className="text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-300 mb-2">
              {dict.noTransactions || 'No Transactions Yet'}
            </h3>
            <p className="text-zinc-500 text-sm max-w-xs">
              {dict.noTransactionsDesc || 'Your payment history will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800 rounded-lg">
                      <CreditCard size={20} className="text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-200">
                        {transaction.type === 'yearly'
                          ? dict.yearlySubscription || 'Yearly Subscription'
                          : dict.monthlySubscription || 'Monthly Subscription'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1">
                        <Calendar size={14} />
                        <span>
                          {new Date(transaction.date).toLocaleDateString(
                            lang === 'ru' ? 'ru-RU' : 'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      {formatAmount(transaction.amount, transaction.currency)}
                    </div>
                    <div
                      className={`flex items-center justify-end gap-1 text-xs ${getStatusColor(transaction.status)}`}
                    >
                      {getStatusIcon(transaction.status)}
                      <span>{getStatusText(transaction.status)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </SwipeablePage>
  );
}
