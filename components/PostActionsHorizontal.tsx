"use client";

import React from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePostActions } from '@/hooks/usePostActions';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { shareCatch } from '@/lib/share';
import { useI18n } from '@/lib/useI18n';

interface PostActionsHorizontalProps {
  catchId: string;
  onCommentClick?: () => void;
  species?: string | null;
}

export const PostActionsHorizontal: React.FC<PostActionsHorizontalProps> = ({
  catchId,
  onCommentClick,
  species = null,
}) => {
  const router = useRouter();
  const { dict } = useI18n();
  const { addNotification } = useNotificationStore();
  const { liked, likesCount, commentsCount, toggleLike } = usePostActions(catchId);

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

  const handleShare = async (e: React.MouseEvent): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();

    const result = await shareCatch({ catchId, species });
    if (result.method === 'clipboard') {
      addNotification({
        message: dict.linkCopied || 'Link copied!',
        type: 'success',
      });
    } else if (result.method === 'failed') {
      addNotification({
        message: dict.shareFailed || result.error,
        type: 'error',
      });
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-around pt-2 border-t border-zinc-800 mt-3">
        <button
          type="button"
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
          type="button"
          onClick={handleComment}
          className="flex items-center gap-2 text-zinc-500 hover:text-blue-400 transition-colors"
        >
          <MessageCircle size={23} />
          {commentsCount > 0 && <span className="text-sm">{commentsCount}</span>}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-2 text-zinc-500 hover:text-blue-400 transition-colors"
          aria-label={dict.share || 'Share'}
        >
          <Share2 size={23} />
        </button>
      </div>
    </div>
  );
};
