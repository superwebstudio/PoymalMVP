"use client";

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/useI18n';

interface SearchBarProps {
  defaultExpanded?: boolean;
}

export const SearchBar = ({ defaultExpanded = false }: SearchBarProps) => {
  const { dict } = useI18n();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsExpanded(false);
      setQuery('');
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="p-2 rounded-full hover:bg-zinc-800 transition-colors flex-shrink-0"
      >
        <Search size={20} className="text-zinc-400" />
      </button>
    );
  }

  return (
    <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 max-w-md min-w-0">
      <div className="flex-1 relative min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.searchUsers}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
          autoFocus={!defaultExpanded}
        />
      </div>
      <button
        type="button"
        onClick={() => {
          setIsExpanded(false);
          setQuery('');
        }}
        className="p-2 text-zinc-500 hover:text-zinc-300 flex-shrink-0"
      >
        <X size={20} />
      </button>
    </form>
  );
};

