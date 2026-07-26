"use client";

import { useEffect } from 'react';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { useUserStore } from '@/stores/useUserStore';
import type { User } from '@/types';

interface SessionUser {
  id: string;
  firstName: string | null;
  username: string | null;
  photoUrl: string | null;
  isPro: boolean;
  language: string;
  proType: string | null;
  country: string | null;
}

interface SessionResponse {
  authenticated: boolean;
  user?: SessionUser;
}

export function AuthBootstrap(): null {
  const setUserId = useUserStore((state) => state.setUserId);
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const setSelectedLanguage = useLanguageStore((state) => state.setSelectedLanguage);

  useEffect(() => {
    let active = true;

    async function hydrateSession(): Promise<void> {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        });

        if (!response.ok) {
          if (active) {
            clearUser();
          }
          return;
        }

        const data = (await response.json()) as SessionResponse;
        if (!active) return;

        if (!data.authenticated || !data.user) {
          clearUser();
          return;
        }

        const user: User = {
          ...data.user,
          catches: [],
          _count: {
            followers: 0,
            following: 0,
          },
        };

        setUserId(user.id);
        setCurrentUser(user);
        setSelectedLanguage(user.language === 'ru' ? 'ru' : 'en');
      } catch (error: unknown) {
        console.error('Unable to restore the signed-in session:', error);
        if (active) {
          clearUser();
        }
      }
    }

    void hydrateSession();

    return () => {
      active = false;
    };
  }, [clearUser, setCurrentUser, setSelectedLanguage, setUserId]);

  return null;
}
