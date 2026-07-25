import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { i18n } from '@/lib/i18n';

type Language = 'en' | 'ru';

interface LanguageStore {
  selectedLanguage: Language;
  dict: any;
  loading: boolean;
  setSelectedLanguage: (lang: Language) => void;
  setLoading: (loading: boolean) => void;
  saveLanguage: (userId?: string) => Promise<void>;
}

const getInitialLanguage = (): Language => {
  // Zustand persist middleware handles localStorage automatically
  return 'en';
};

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => {
      const initialLang = getInitialLanguage();
      return {
        selectedLanguage: initialLang,
        dict: i18n[initialLang] as any,
        loading: false,
        setSelectedLanguage: (lang) => {
          set({ 
            selectedLanguage: lang,
            dict: i18n[lang] as any
          });
        },
        setLoading: (loading) => set({ loading }),
        saveLanguage: async (userId?: string) => {
          const { selectedLanguage } = get();
          set({ loading: true });
          
          try {
            // Zustand persist middleware automatically saves to localStorage
            // Update user language in database
            if (userId) {
              await fetch('/api/user/language', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  language: selectedLanguage,
                }),
              });
            }
          } catch (error) {
            console.error('Error saving language:', error);
            throw error;
          } finally {
            set({ loading: false });
          }
        },
      };
    },
    {
      name: 'language-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedLanguage: state.selectedLanguage }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const lang = state.selectedLanguage || getInitialLanguage();
          state.dict = i18n[lang] as any;
        }
      },
    }
  )
);

