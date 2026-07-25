"use client";

import React, { useState, useRef } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { DiscoverToggle } from '@/components/DiscoverToggle';
import { SearchBar } from '@/components/SearchBar';
import { Trophy, Newspaper, ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/useI18n';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';

export default function DiscoverPage() {
  const { dict } = useI18n();
  const [activeTab, setActiveTab] = useState<'news' | 'leaderboard'>('news');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [bottomNavVisible, setBottomNavVisible] = useState(true);
  const [showDiscoverDropdown, setShowDiscoverDropdown] = useState(false);
  const lastScrollY = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const current = latest;
    const previous = lastScrollY.current;

    if (current > previous && current > 100) {
      setHeaderVisible(false);
      setBottomNavVisible(false);
    } else if (current < previous) {
      setHeaderVisible(true);
      setBottomNavVisible(true);
    }

    lastScrollY.current = current;
  });

  const handleTabChange = (tab: 'news' | 'leaderboard') => {
    if (tab === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsTransitioning(false);
    }, 150);
    setShowDiscoverDropdown(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDiscoverDropdown(false);
      }
    };

    if (showDiscoverDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDiscoverDropdown]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 pb-[120px] text-zinc-100">
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: headerVisible ? 0 : -57 }}
        transition={{ duration: 0.3 }}
        className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 fixed top-0 left-0 right-0 z-30 h-[57px] flex items-center justify-between gap-3"
      >
        {/* Discover Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDiscoverDropdown(!showDiscoverDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-200 text-sm font-medium"
          >
            <span>{activeTab === 'news' ? dict.news : dict.leaderboard}</span>
            <ChevronDown size={16} className={`transition-transform ${showDiscoverDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showDiscoverDropdown && (
            <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg overflow-hidden min-w-[140px] z-50">
              <button
                onClick={() => handleTabChange('news')}
                className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${activeTab === 'news'
                  ? 'bg-sky-600 text-white'
                  : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
              >
                <Newspaper size={16} />
                {dict.news}
              </button>
              <button
                onClick={() => handleTabChange('leaderboard')}
                className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${activeTab === 'leaderboard'
                  ? 'bg-yellow-600 text-white'
                  : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
              >
                <Trophy size={16} />
                {dict.leaderboard}
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 flex justify-end min-w-0">
          <SearchBar defaultExpanded={true} />
        </div>
      </motion.header>

      <main className="flex-1 p-4 relative min-h-[400px] mt-[73px]">
        <DiscoverToggle activeTab={activeTab} isTransitioning={isTransitioning} />
      </main>

      <motion.div
        initial={{ y: 0 }}
        animate={{ y: bottomNavVisible ? 0 : 100 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        <BottomNav />
      </motion.div>
    </div>
  );
}
