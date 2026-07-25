"use client";

import React from 'react';
import { Globe, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/useI18n';

interface FeedToggleProps {
  feedType: 'all' | 'following';
  onFeedTypeChange: (type: 'all' | 'following') => void;
}

export const FeedToggle: React.FC<FeedToggleProps> = ({ feedType, onFeedTypeChange }) => {
  const { dict, mounted } = useI18n();

  if (!mounted) {
    return (
      <div className="flex gap-2">
        <div className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium bg-zinc-800">
          <Globe size={18} />
          <span>All</span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium bg-zinc-800">
          <Users size={18} />
          <span>Following</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => onFeedTypeChange('all')}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors",
          feedType === 'all'
            ? "bg-sky-600 text-white"
            : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
        )}
      >
        <Globe size={18} />
        <span>{dict.all}</span>
      </button>
      <button
        onClick={() => onFeedTypeChange('following')}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors",
          feedType === 'following'
            ? "bg-sky-600 text-white"
            : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
        )}
      >
        <Users size={18} />
        <span>{dict.following}</span>
      </button>
    </div>
  );
};

