"use client";

import React, { useEffect, useRef } from 'react';
import { FeedPostCard } from '@/components/FeedPostCard';
import { useFeedStore } from '@/stores/useFeedStore';
import { useUserStore } from '@/stores/useUserStore';

interface FeedPageContentProps {
  scrollPosition?: number;
  onScroll?: (scrollTop: number) => void;
}

export function FeedPageContent({ scrollPosition = 0, onScroll }: FeedPageContentProps) {
  const { feed } = useFeedStore();
  const { currentUser } = useUserStore();
  const feedRef = useRef<HTMLDivElement>(null);

  // Restore scroll position when component mounts or scrollPosition changes
  useEffect(() => {
    if (feedRef.current && scrollPosition > 0) {
      const setScroll = () => {
        if (feedRef.current) {
          feedRef.current.scrollTop = scrollPosition;
          requestAnimationFrame(() => {
            if (feedRef.current && Math.abs(feedRef.current.scrollTop - scrollPosition) > 10) {
              feedRef.current.scrollTop = scrollPosition;
            }
          });
        }
      };
      setScroll();
      setTimeout(setScroll, 10);
      setTimeout(setScroll, 50);
      setTimeout(setScroll, 100);
    }
  }, [scrollPosition, feed.length]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <div
        ref={feedRef}
        className="p-4 space-y-4 overflow-y-auto"
        style={{ paddingTop: '97px', minHeight: '100vh' }}
        onScroll={(e) => {
          if (onScroll) {
            const scrollTop = (e.target as HTMLElement).scrollTop;
            onScroll(scrollTop);
          }
        }}
      >
        {/* AD Banner - Commented out for later use */}
        {/* 
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
          <div className="text-center text-zinc-400 text-sm">Advertisement</div>
        </div>
        */}
        {feed.length > 0 ? (
          feed.map((item) => (
            <FeedPostCard
              key={item.id}
              item={item}
              currentUserId={currentUser?.id}
              onDeleteSuccess={() => {}}
              onCommentClick={() => {}}
            />
          ))
        ) : (
          <div className="text-center text-zinc-500 py-10">
            No catches yet
          </div>
        )}
      </div>
    </div>
  );
}

