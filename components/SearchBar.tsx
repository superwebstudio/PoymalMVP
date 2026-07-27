"use client";

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/useI18n';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  defaultExpanded?: boolean;
  alwaysExpanded?: boolean;
  className?: string;
}

export const SearchBar = ({
  defaultExpanded = false,
  alwaysExpanded = false,
  className,
}: SearchBarProps): React.JSX.Element => {
  const { dict } = useI18n();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || alwaysExpanded);
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    if (!alwaysExpanded) {
      setIsExpanded(false);
      setQuery('');
    }
  };

  if (!isExpanded && !alwaysExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="p-2 rounded-full hover:bg-zinc-800 transition-colors flex-shrink-0"
      >
        <Search size={20} className="text-zinc-400" />
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSearch}
      className={cn('flex min-w-0 max-w-md flex-1 items-center gap-2', className)}
    >
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.searchUsers}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-10 pr-3 text-zinc-100 placeholder-zinc-500 transition-colors focus:outline-none"
          autoFocus={!alwaysExpanded && !defaultExpanded}
        />
      </div>
      {!alwaysExpanded && (
        <button
          type="button"
          onClick={() => {
            setIsExpanded(false);
            setQuery('');
          }}
          className="shrink-0 p-2 text-zinc-500 hover:text-zinc-300"
        >
          <X size={20} />
        </button>
      )}
    </form>
  );
};

