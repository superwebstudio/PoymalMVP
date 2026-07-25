import { create } from 'zustand';
import type { User, Catch } from '@/types';

interface ProfileStore {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  fetchUser: (userId: string) => Promise<void>;
  updateCatch: (catchId: string, updates: Partial<Catch>) => void;
  removeCatch: (catchId: string) => void;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  fetchUser: async (userId: string) => {
    // Don't set loading to true - use cached data immediately
    try {
      const response = await fetch(`/api/user/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        
        // Ensure catches is always an array
        if (!userData.catches) {
          userData.catches = [];
        }

        // Convert date strings to Date objects
        userData.catches = userData.catches.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
        }));

        set({ user: userData, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      set({ loading: false });
    }
  },
  updateCatch: (catchId: string, updates: Partial<Catch>) => {
    set((state) => {
      if (!state.user) return state;
      const updatedCatches = state.user.catches.map((c) =>
        c.id === catchId ? { ...c, ...updates } : c
      );
      // If unpinning, ensure no other catch is pinned
      if (updates.isPinned === false) {
        // Already handled by the update above
      }
      // If pinning, unpin all other catches
      if (updates.isPinned === true) {
        updatedCatches.forEach((c) => {
          if (c.id !== catchId && (c as any).isPinned) {
            (c as any).isPinned = false;
          }
        });
      }
      return {
        user: {
          ...state.user,
          catches: updatedCatches,
        },
      };
    });
  },
  removeCatch: (catchId: string) => {
    set((state) => {
      if (!state.user) return state;
      return {
        user: {
          ...state.user,
          catches: state.user.catches.filter((c) => c.id !== catchId),
        },
      };
    });
  },
}));

