"use client";

import React, { useState } from 'react';
import { useI18n } from '@/lib/useI18n';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  currentUserId: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  isFollowing: initialFollowing,
  currentUserId
}) => {
  const { dict } = useI18n();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: isFollowing ? 'unfollow' : 'follow' }),
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`w-full py-2 rounded-lg font-semibold transition-colors ${isFollowing
          ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          : 'bg-sky-600 text-white hover:bg-sky-500'
        } disabled:opacity-50`}
    >
      {isLoading ? '...' : isFollowing ? dict.unfollow : dict.follow}
    </button>
  );
};

