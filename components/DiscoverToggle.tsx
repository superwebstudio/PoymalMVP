"use client";

import React from 'react';
import { NewsContent } from './NewsContent';
import { LeaderboardContent } from './LeaderboardContent';
import { motion, AnimatePresence } from 'framer-motion';

interface DiscoverToggleProps {
  activeTab: 'news' | 'leaderboard';
  isTransitioning: boolean;
}

export const DiscoverToggle: React.FC<DiscoverToggleProps> = ({ activeTab, isTransitioning }) => {
  return (
    <div className="relative min-h-[400px]">
      <AnimatePresence mode="wait">
        {isTransitioning ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full"
            />
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'news' ? <NewsContent /> : <LeaderboardContent />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

