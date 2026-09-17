"use client";

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { AtSign, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguageStore } from '@/stores/useLanguageStore';

const languages = [
  { code: 'en' as const, name: 'English', flag: '🇬🇧' },
  { code: 'ru' as const, name: 'Русский', flag: '🇷🇺' },
];

export default function LanguageSelectPage() {
  const router = useRouter();
  const { selectedLanguage, setSelectedLanguage } = useLanguageStore();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username,
          language: selectedLanguage,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? 'Unable to save your profile');
        return;
      }

      router.replace('/');
      router.refresh();
    } catch {
      setError('Unable to save your profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-block" aria-label="Poymal home">
              <Image
                src="/logo-max.svg"
                alt="Poymal"
                width={180}
                height={72}
                priority
                className="h-auto w-40 mx-auto mb-8"
              />
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to Poymal
            </h1>
            <p className="text-zinc-400">
              Choose your username and app language.
            </p>
          </div>

          <form onSubmit={handleContinue} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Username
              </label>
              <div className="relative">
                <AtSign
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                  aria-hidden="true"
                />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, '')
                        .slice(0, 20),
                    )
                  }
                  autoComplete="username"
                  minLength={3}
                  maxLength={20}
                  pattern="[a-z0-9_]{3,20}"
                  placeholder="your_username"
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 pl-11 pr-4 text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-sky-500"
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                3–20 lowercase letters, numbers, or underscores.
              </p>
            </div>

            <fieldset className="space-y-3">
              <legend className="mb-2 text-sm font-medium text-zinc-300">
                App language
              </legend>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    selectedLanguage === lang.code
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
            </fieldset>

            {error ? (
              <p
                role="alert"
                className="rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading || username.length < 3}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>

      <div className="p-6 text-center text-zinc-500 text-sm">
        You can change your language later in settings.
      </div>
    </div>
  );
}

