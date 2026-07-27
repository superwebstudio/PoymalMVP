"use client";

import React from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { motion, type MotionValue } from 'framer-motion';
import { useI18n } from '@/lib/useI18n';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/useUserStore';
import { useUnreadNotificationsStore } from '@/stores/useUnreadNotificationsStore';

interface FeedTabsProps {
  currentView: 'feed' | 'news';
  feedType: 'all' | 'news' | 'leaderboard';
  onTabChange: (type: 'all' | 'news' | 'leaderboard') => void;
  y: MotionValue<number>;
}

export const FeedTabs: React.FC<FeedTabsProps> = ({
  currentView,
  feedType,
  onTabChange,
  y,
}) => {
  const { dict, mounted } = useI18n();
  const { userId } = useUserStore();
  const unreadCount = useUnreadNotificationsStore((s) => s.unreadCount);

  const tabs = [
    { id: 'all', label: mounted ? dict.all : 'All', type: 'all' as const },
    { id: 'news', label: mounted ? dict.news : 'News', type: 'news' as const },
  ];

  const getActiveTab = (): 'all' | 'news' => {
    if (currentView === 'news') return 'news';
    if (feedType === 'news' || feedType === 'leaderboard') return 'news';
    return 'all';
  };

  const activeTab = getActiveTab();

  const notificationsHref = userId
    ? '/notifications'
    : '/login?next=/notifications';

  return (
    <motion.div
      style={{ y }}
      className="fixed top-0 left-0 right-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 px-3 py-3">
        <div className="min-w-0 flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.type;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.type)}
                  className={cn(
                    'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/30'
                      : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300',
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {userId ? (
          <Link
            href={notificationsHref}
            className="relative shrink-0 rounded-full p-2 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label={dict.notifications || 'Notifications'}
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        ) : null}
      </div>
    </motion.div>
  );
};
