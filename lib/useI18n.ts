"use client";

import { useEffect, useState } from 'react';
import { Language } from './i18n';
import { useLanguageStore } from '@/stores/useLanguageStore';

export const useI18n = () => {
  // Subscribe to language store instead of using localStorage directly
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const dict = useLanguageStore((state) => state.dict);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted (client-side only)
    setMounted(true);
  }, []);

  const changeLanguage = (newLang: Language) => {
    useLanguageStore.getState().setSelectedLanguage(newLang);
    // Dispatch event for components that might still listen
    window.dispatchEvent(new Event('languageChanged'));
  };

  return { dict, lang: selectedLanguage, changeLanguage, mounted };
};
