"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/lib/useI18n';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReactionButtonsProps {
  catchId: string;
  reactions?: { emoji: string; userId: string }[];
  currentUserId?: string;
}

const REACTION_EMOJIS = ['🔥', '💪', '🎣', '👍', '😮'];

export const ReactionButtons: React.FC<ReactionButtonsProps> = ({
  catchId,
  reactions = [],
  currentUserId
}) => {
  const { dict } = useI18n();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [localReactions, setLocalReactions] = useState(reactions);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalReactions(reactions);
  }, [reactions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  // Count reactions by emoji
  const reactionCounts = localReactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Check if current user has reacted
  const userReaction = localReactions.find(r => r.userId === currentUserId)?.emoji;

  const handleReaction = async (emoji: string) => {
    if (!currentUserId) return;

    setShowEmojiPicker(false);

    try {
      const response = await fetch(`/api/catch/${catchId}/reaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ emoji }),
      });

      if (response.ok) {
        const data = await response.json();
        setLocalReactions(data.reactions || []);
      }
    } catch (error) {
      console.error('Error reacting:', error);
    }
  };

  const totalReactions = localReactions.length;
  const topReactions = Object.entries(reactionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="flex items-center gap-2 relative" ref={pickerRef}>
      {/* Like Button */}
      <button
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        className={`flex items-center gap-1 transition-colors ${userReaction ? 'text-red-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
      >
        <Heart
          size={18}
          className={userReaction ? 'fill-red-400 text-red-400' : ''}
        />
        {totalReactions > 0 && (
          <span className="text-xs">{totalReactions}</span>
        )}
      </button>

      {/* Display top reactions */}
      {topReactions.length > 0 && (
        <div className="flex items-center gap-1">
          {topReactions.map(([emoji, count]) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className={`text-sm transition-transform hover:scale-110 ${userReaction === emoji ? 'scale-110' : ''
                }`}
            >
              {emoji}
              {count > 1 && <span className="text-xs ml-0.5">{count}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Picker with Slide Animation */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute left-0 bottom-full mb-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-2 flex items-center gap-2 z-50"
          >
            {REACTION_EMOJIS.map((emoji, index) => (
              <motion.button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`text-2xl hover:scale-125 transition-transform ${userReaction === emoji ? 'scale-125' : ''
                  }`}
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

