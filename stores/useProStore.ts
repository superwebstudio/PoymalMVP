import { create } from 'zustand';
import type { PlanType, PaymentMethod, User } from '@/types';

interface ProStore {
  currentUser: User | null;
  loading: boolean;
  selectedPlan: PlanType | null;
  selectedPayment: PaymentMethod;
  isProcessing: boolean;
  setCurrentUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setSelectedPlan: (plan: PlanType | null) => void;
  setSelectedPayment: (method: PaymentMethod) => void;
  setIsProcessing: (processing: boolean) => void;
  fetchUser: (userId: string) => Promise<void>;
  handleStripeCheckout: (plan: PlanType) => Promise<void>;
  confirmStripeSession: (sessionId: string) => Promise<boolean>;
}

export const useProStore = create<ProStore>((set) => ({
  currentUser: null,
  loading: true,
  selectedPlan: 'monthly',
  selectedPayment: 'stripe',
  isProcessing: false,
  setCurrentUser: (user) => set({ currentUser: user }),
  setLoading: (loading) => set({ loading }),
  setSelectedPlan: (plan) => set({ selectedPlan: plan }),
  setSelectedPayment: (method) => set({ selectedPayment: method }),
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  fetchUser: async (userId: string) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/user/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        set({ currentUser: userData, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      set({ loading: false });
    }
  },
  handleStripeCheckout: async (plan: PlanType) => {
    const response = await fetch('/api/payment/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ plan }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
    };

    if (!response.ok || !data.url) {
      throw new Error(data.error || 'Failed to start Stripe checkout');
    }

    window.location.href = data.url;
  },
  confirmStripeSession: async (sessionId: string) => {
    try {
      const response = await fetch('/api/payment/confirm-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ sessionId }),
      });
      return response.ok;
    } catch (error) {
      console.error('Stripe session confirm error:', error);
      return false;
    }
  },
}));
