import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useUserStore } from './useUserStore';

interface UserPreferences {
  showTelegramHandle: boolean;
  showCountryBadge: boolean;
  country: string | null;
  notificationsEnabled: boolean;
  notifyOnLikes: boolean;
  notifyOnComments: boolean;
}

interface PreferencesStore {
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;

  setPreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;

  setPreferences: (prefs: Partial<UserPreferences>) => void;

  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => Promise<void>;

  fetchPreferences: (userId: string) => Promise<void>;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const preferenceKeys: (keyof UserPreferences)[] = [
  'showTelegramHandle',
  'showCountryBadge',
  'country',
  'notificationsEnabled',
  'notifyOnLikes',
  'notifyOnComments',
];

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set, get) => ({
      preferences: {
        showTelegramHandle: true,
        showCountryBadge: true,
        country: null,
        notificationsEnabled: true,
        notifyOnLikes: true,
        notifyOnComments: true,
      },
      loading: false,
      error: null,

      setPreference: (key, value) => {
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        }));
      },

      setPreferences: (prefs) => {
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        }));
      },

      updatePreference: async (key, value) => {
        const { preferences } = get();
        const userId = useUserStore.getState().userId;

        if (!userId) {
          console.error('No userId found in useUserStore');
          return;
        }

        const oldValue = preferences[key];
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        }));

        try {
          const response = await fetch('/api/user/preferences', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ [key]: value }),
          });

          if (!response.ok) {
            let errorData: { error?: string };
            try {
              errorData = await response.json();
            } catch {
              errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
            }
            throw new Error(errorData.error || `Failed to update preference: ${response.status}`);
          }

          const updatedData = await response.json();

          set((state) => {
            const next = { ...state.preferences };
            for (const k of preferenceKeys) {
              if (updatedData[k] !== undefined) {
                (next as Record<string, unknown>)[k] = updatedData[k];
              }
            }
            return { preferences: next };
          });
        } catch (error) {
          console.error('Error updating preference:', error);
          set((state) => ({
            preferences: { ...state.preferences, [key]: oldValue },
            error: error instanceof Error ? error.message : 'Failed to update',
          }));
        }
      },

      fetchPreferences: async (userId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await fetch(`/api/user/${userId}`, {
            credentials: 'include',
          });
          if (!response.ok) throw new Error('Failed to fetch preferences');

          const userData = await response.json();
          const prefs: UserPreferences = {
            showTelegramHandle: userData.showTelegramHandle ?? true,
            showCountryBadge: userData.showCountryBadge ?? true,
            country: userData.country || null,
            notificationsEnabled: userData.notificationsEnabled ?? true,
            notifyOnLikes: userData.notifyOnLikes ?? true,
            notifyOnComments: userData.notifyOnComments ?? true,
          };

          set({ preferences: prefs, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch',
            loading: false,
          });
        }
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ preferences: state.preferences }),
    }
  )
);
