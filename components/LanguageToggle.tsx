"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { useUserStore } from '@/stores/useUserStore';

interface LanguageToggleProps {
  currentLanguage: string;
  userId: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ currentLanguage, userId }) => {
  const { selectedLanguage, setSelectedLanguage } = useLanguageStore();
  const { userId: storeUserId } = useUserStore();
  const [isChanging, setIsChanging] = useState(false);
  const router = useRouter();
  const finalUserId = userId || storeUserId || '';
  const activeLanguage = selectedLanguage || (currentLanguage === 'ru' ? 'ru' : 'en');

  const handleLanguageChange = async (lang: 'en' | 'ru') => {
    if (lang === activeLanguage || isChanging) return;

    // Immediately update UI via store
    setSelectedLanguage(lang);
    setIsChanging(true);

    // Dispatch event for components that listen
    window.dispatchEvent(new Event('languageChanged'));

    // Update database in background
    try {
      if (finalUserId) {
        await fetch('/api/user/language', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ language: lang }),
        });
      }

      // Refresh server components
      router.refresh();
    } catch (error) {
      console.error('Language change error:', error);
    } finally {
      setTimeout(() => {
        setIsChanging(false);
      }, 300);
    }
  };

  return (
    <div className="flex gap-2 text-sm">
      <button
        onClick={() => handleLanguageChange('ru')}
        disabled={isChanging}
        className={cn(
          "px-3 py-1 rounded transition-all duration-200",
          activeLanguage === 'ru'
            ? "bg-sky-600 text-white"
            : "bg-zinc-800 text-zinc-400 hover:text-zinc-200",
          isChanging && "opacity-50 cursor-not-allowed"
        )}
      >
        RU
      </button>
      <button
        onClick={() => handleLanguageChange('en')}
        disabled={isChanging}
        className={cn(
          "px-3 py-1 rounded transition-all duration-200",
          activeLanguage === 'en'
            ? "bg-sky-600 text-white"
            : "bg-zinc-800 text-zinc-400 hover:text-zinc-200",
          isChanging && "opacity-50 cursor-not-allowed"
        )}
      >
        EN
      </button>
    </div>
  );
};

