"use client";

import React, { useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { useUserStore } from '@/stores/useUserStore';

const languages = [
  { code: 'en' as const, name: 'English', flag: '🇬🇧' },
  { code: 'ru' as const, name: 'Русский', flag: '🇷🇺' },
];

export default function LanguageSelectPage() {
  const router = useRouter();
  const { userId } = useUserStore();
  const { selectedLanguage, dict, loading, setSelectedLanguage, saveLanguage } = useLanguageStore();

  const handleContinue = async () => {
    try {
      await saveLanguage(userId || undefined);

      // Navigate to home
      router.push('/');
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <img
              src="/logo-max.svg"
              alt="Ulov"
              className="h-24 mx-auto mb-8"
            />
            <h1 className="text-3xl font-bold text-white mb-2">
              {dict.welcomeToUlov || 'Welcome to Ulov'}
            </h1>
            <p className="text-zinc-400">
              {dict.selectPreferredLanguage || 'Select your preferred language'}
            </p>
          </div>

          {/* Language Options */}
          <div className="space-y-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedLanguage === lang.code
                  ? 'bg-sky-600 border-sky-500'
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{lang.flag}</span>
                  <span className="text-lg font-semibold text-white">
                    {lang.name}
                  </span>
                </div>
                {selectedLanguage === lang.code && (
                  <Check size={24} className="text-white" />
                )}
              </button>
            ))}
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? (dict.loading || 'Loading...') : (dict.continue || 'Continue')}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center text-zinc-500 text-sm">
        {dict.canChangeLater || 'You can change this later in settings'}
      </div>
    </div>
  );
}

