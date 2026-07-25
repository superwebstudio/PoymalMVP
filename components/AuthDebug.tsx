"use client";

import { useUserStore } from '@/stores/useUserStore';
import { useLanguageStore } from '@/stores/useLanguageStore';

export function AuthDebug() {
  const { userId, currentUser } = useUserStore();
  const { selectedLanguage } = useLanguageStore();

  const debugInfo = [
    `✅ Authenticated: ${userId ? 'YES' : 'NO'}`,
    userId ? `User ID: ${userId}` : '',
    currentUser?.firstName ? `Name: ${currentUser.firstName}` : '',
    currentUser?.username ? `Username: @${currentUser.username}` : '',
    `Language: ${selectedLanguage || 'Not set'}`,
    'Auth provider: Supabase',
  ].filter(Boolean).join('\n');

  if (!debugInfo) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs text-zinc-400 z-50 max-h-32 overflow-y-auto">
      <div className="font-bold text-zinc-300 mb-1">Debug Info:</div>
      <pre className="whitespace-pre-wrap">{debugInfo}</pre>
    </div>
  );
}

