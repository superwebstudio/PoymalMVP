"use client";

import React, { useState } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePostActions } from '@/hooks/usePostActions';
import { useNotificationStore } from '@/stores/useNotificationStore';

interface PostActionsHorizontalProps {
  catchId: string;
  onCommentClick?: () => void;
}

export const PostActionsHorizontal: React.FC<PostActionsHorizontalProps> = ({
  catchId,
  onCommentClick,
}) => {
  const router = useRouter();
  const { addNotification } = useNotificationStore();

  // Use shared hook for consistent state - SAME as PostActions
  const { liked, likesCount, commentsCount, toggleLike } = usePostActions(catchId);

  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike();
  };

  const handleComment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCommentClick) {
      onCommentClick();
    } else {
      router.push(`/catch/${catchId}#comments`);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareMenu(!showShareMenu);
  };

  const handleSendMessage = () => {
    setShowShareMenu(false);
    const catchUrl = `${window.location.origin}/catch/${catchId}`;
    navigator.clipboard.writeText(catchUrl).then(() => {
      addNotification({
        message: 'Link copied to clipboard!',
        type: 'success',
      });
    });
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-around pt-2 border-t border-zinc-800 mt-3">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 transition-colors ${liked ? 'text-red-400' : 'text-zinc-500 hover:text-red-400'}`}
        >
          <Heart
            size={23}
            className={liked ? 'fill-red-400 text-red-400' : 'text-zinc-500'}
            fill={liked ? 'currentColor' : 'none'}
          />
          {likesCount > 0 && <span className="text-sm">{likesCount}</span>}
        </button>

        <button
          onClick={handleComment}
          className="flex items-center gap-2 text-zinc-500 hover:text-blue-400 transition-colors"
        >
          <MessageCircle size={23} />
          {commentsCount > 0 && <span className="text-sm">{commentsCount}</span>}
        </button>

        <div className="relative">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-zinc-500 hover:text-blue-400 transition-colors"
          >
            <Share2 size={23} />
          </button>
          {showShareMenu && (
            <div className="absolute right-0 bottom-full mb-2 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50">
              <button
                onClick={handleSendMessage}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 text-zinc-300 transition-colors whitespace-nowrap"
              >
                <MessageCircle size={18} />
                <span>Send as Message</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
