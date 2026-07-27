"use client";

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/lib/useI18n';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  currentUserId: string;
  compact?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  isFollowing: initialFollowing,
  currentUserId,
  compact = false,
  onFollowChange,
}) => {
  const { dict } = useI18n();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsFollowing(initialFollowing);
  }, [initialFollowing]);

  const handleFollow = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ): Promise<void> => {
    event.preventDefault();
    event.stopPropagation();
    if (!currentUserId || currentUserId === userId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          action: isFollowing ? 'unfollow' : 'follow',
        }),
      });

      if (response.ok) {
        const next = !isFollowing;
        setIsFollowing(next);
        onFollowChange?.(next);
      }
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleFollow}
      disabled={isLoading}
      className={cn(
        'rounded-lg font-semibold transition-colors disabled:opacity-50',
        compact ? 'shrink-0 px-3 py-1.5 text-sm' : 'w-full py-2',
        isFollowing
          ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          : 'bg-sky-600 text-white hover:bg-sky-500',
      )}
    >
      {isLoading ? '...' : isFollowing ? dict.unfollow : dict.follow}
    </button>
  );
};

