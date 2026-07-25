"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/useI18n';
import { cn } from '@/lib/utils';

interface FeedTabsProps {
    currentView: 'feed' | 'news';
    feedType: 'all' | 'following' | 'news' | 'leaderboard';
    onTabChange: (type: 'all' | 'following' | 'news' | 'leaderboard') => void;
    y: any; // Motion value for scroll-based hiding
}

export const FeedTabs: React.FC<FeedTabsProps> = ({ currentView, feedType, onTabChange, y }) => {
    const { dict, mounted } = useI18n();

    const tabs = [
        { id: 'all', label: mounted ? dict.all : 'All', type: 'all' as const },
        { id: 'following', label: mounted ? dict.following : 'Following', type: 'following' as const },
        { id: 'news', label: mounted ? dict.news : 'News', type: 'news' as const },
    ];

    const getActiveTab = (): 'all' | 'following' | 'news' => {
        if (currentView === 'news') return 'news';
        if (feedType === 'news' || feedType === 'leaderboard') return 'news';
        return feedType === 'following' ? 'following' : 'all';
    };

    const activeTab = getActiveTab();

    const handleTabClick = (tabType: 'all' | 'following' | 'news' | 'leaderboard') => {
        onTabChange(tabType);
    };

    return (
        <motion.div
            style={{ y }}
            className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800"
        >
            <div className="px-4 py-3 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 min-w-max">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.type;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab.type)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                                    isActive
                                        ? "bg-sky-600 text-white shadow-lg shadow-sky-900/30"
                                        : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                                )}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

