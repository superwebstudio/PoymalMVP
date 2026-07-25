import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface UserState {
  userId: string | null;
  setUserId: (id: string | null) => void;
  recentSpecies: string[];
  addRecentSpecies: (species: string) => void;
  currentUser: User | null;
  followingCount: number;
  loading: boolean;
  setCurrentUser: (user: User | null) => void;
  setFollowingCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
  fetchUser: (userId: string) => Promise<void>;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      setUserId: (id) => set({ userId: id }),
      recentSpecies: [],
      addRecentSpecies: (species) => set((state) => {
        const newSpecies = [species, ...state.recentSpecies.filter(s => s !== species)].slice(0, 5);
        return { recentSpecies: newSpecies };
      }),
      currentUser: null,
      followingCount: 0,
      loading: false,
      setCurrentUser: (user) => set({ currentUser: user }),
      setFollowingCount: (count) => set({ followingCount: count }),
      setLoading: (loading) => set({ loading }),
      fetchUser: async (userId: string) => {
        set({ loading: true });
        try {
          const response = await fetch(`/api/user/${userId}`);
          if (response.ok) {
            const userData = await response.json();
            set({ 
              currentUser: userData, 
              followingCount: userData._count?.following || 0,
              loading: false 
            });
          } else {
            set({ loading: false });
          }
        } catch (error) {
          console.error('Error fetching user:', error);
          set({ loading: false });
        }
      },
      clearUser: () => set({ userId: null, currentUser: null, followingCount: 0 }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ 
        recentSpecies: state.recentSpecies 
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<UserState>;
        return {
          ...currentState,
          recentSpecies: Array.isArray(persisted.recentSpecies)
            ? persisted.recentSpecies
            : [],
        };
      },
    }
  )
);
