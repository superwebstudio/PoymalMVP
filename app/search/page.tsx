"use client";

import React, { useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { TelegramBackButton } from '@/components/TelegramBackButton';
import { Search as SearchIcon, X } from 'lucide-react';
import Link from 'next/link';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 pb-[80px] text-zinc-100">
      <TelegramBackButton fallbackUrl="/settings" />
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search anglers..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-10 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
              autoFocus
            />
            {query && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        {isLoading && (
          <div className="text-center py-10 text-zinc-500">
            <div className="w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Searching...
          </div>
        )}

        {!isLoading && query && results.length === 0 && (
          <div className="text-center py-10 text-zinc-500">
            No anglers found
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="space-y-2">
            {results.map((user: any) => (
              <Link
                key={user.id}
                href={`/user/${user.id}`}
                className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500">?</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-zinc-200 truncate flex items-center gap-2">
                    {user.firstName || user.username || 'Angler'}
                    {user.isPro && (
                      <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/30">
                        PRO
                      </span>
                    )}
                  </div>
                  {user.username && (
                    <div className="text-sm text-zinc-500">@{user.username}</div>
                  )}
                </div>
                <div className="text-xs text-zinc-500">
                  {user._count?.catches || 0} catches
                </div>
              </Link>
            ))}
          </div>
        )}

        {!query && (
          <div className="text-center py-10 text-zinc-500">
            <SearchIcon className="mx-auto mb-2 text-zinc-600" size={48} />
            <p>Search for anglers by name or username</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

