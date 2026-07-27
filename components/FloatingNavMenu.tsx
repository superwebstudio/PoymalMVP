"use client";

import React, { useState } from 'react';
import { Globe, Newspaper, Trophy, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/useI18n';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingNavMenuProps {
    feedType: 'all' | 'news' | 'leaderboard';
    currentView: 'feed' | 'news' | 'leaderboard';
    onFeedTypeChange: (type: 'all' | 'news' | 'leaderboard') => void;
}

export const FloatingNavMenu: React.FC<FloatingNavMenuProps> = ({
    feedType,
    currentView,
    onFeedTypeChange
}) => {
    const { dict, mounted } = useI18n();
    const [isExpanded, setIsExpanded] = useState(false);

    const isActive = (type: 'all' | 'news' | 'leaderboard') => {
        if (type === 'news' || type === 'leaderboard') {
            return currentView === type;
        }
        return feedType === type && currentView === 'feed';
    };

    const menuItems = [
        {
            type: 'all' as const,
            icon: Globe,
            label: mounted ? dict.all : 'All'
        },
        {
            type: 'news' as const,
            icon: Newspaper,
            label: mounted ? (dict as Record<string, string>).news || 'News' : 'News'
        },
        {
            type: 'leaderboard' as const,
            icon: Trophy,
            label: mounted ? (dict as Record<string, string>).leaderboard || 'Leaderboard' : 'Leaderboard'
        },
    ];

    const activeItem = menuItems.find(item => isActive(item.type)) || menuItems[0];

    const handleItemClick = (type: 'all' | 'news' | 'leaderboard') => {
        onFeedTypeChange(type);
        setIsExpanded(false);
    };

    return (
        <>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 z-[45] bg-black/40 backdrop-blur-sm"
                        onClick={() => setIsExpanded(false)}
                    />
                )}
            </AnimatePresence>

            <div className="fixed bottom-24 right-6 z-[50] flex flex-col items-end">
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            transition={{
                                type: "spring",
                                damping: 20,
                                stiffness: 300
                            }}
                            className="bg-zinc-900/90 backdrop-blur-2xl rounded-[28px] border border-zinc-800/60 p-4 mb-5 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="space-y-3">
                                {menuItems.map((item, index) => {
                                    const active = isActive(item.type);
                                    return (
                                        <motion.button
                                            key={item.type}
                                            initial={false}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{
                                                delay: index * 0.06,
                                                duration: 0.3,
                                                ease: [0.34, 1.56, 0.64, 1]
                                            }}
                                            onClick={() => handleItemClick(item.type)}
                                            whileHover={{ scale: 1.02, x: 4 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={cn(
                                                "w-full flex items-center gap-4 py-3.5 px-5 rounded-[20px] font-medium transition-all duration-300",
                                                active
                                                    ? "bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-lg shadow-sky-600/25"
                                                    : "bg-zinc-800/30 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                                            )}
                                        >
                                            <item.icon
                                                size={22}
                                                strokeWidth={2.5}
                                                className={cn(
                                                    "transition-transform duration-300",
                                                    active && "scale-110"
                                                )}
                                            />
                                            <span className="text-[15px] font-semibold tracking-wide">
                                                {item.label}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    onClick={() => setIsExpanded(!isExpanded)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 p-4 rounded-full font-semibold transition-all duration-300 bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-xl shadow-sky-600/30 hover:shadow-sky-600/40"
                >
                    <activeItem.icon size={22} strokeWidth={2.5} />
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <ChevronUp size={18} strokeWidth={3} />
                    </motion.div>
                </motion.button>
            </div>
        </>
    );
};
