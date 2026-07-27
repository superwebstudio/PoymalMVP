"use client";

import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, Bookmark, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/useUserStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { usePostActions } from "@/hooks/usePostActions";
import { SavedPostsSheet } from "@/components/SavedPostsSheet";

interface PostActionsProps {
  catchId: string;
  onCommentClick?: () => void;
  initialSaved?: boolean;
  viewCount?: number;
  showViewCount?: boolean;
}

export const PostActions: React.FC<PostActionsProps> = ({
  catchId,
  onCommentClick,
  initialSaved,
  viewCount = 0,
  showViewCount = false,
}) => {
  const router = useRouter();
  const { userId } = useUserStore();
  const { addNotification } = useNotificationStore();
  const { liked, likesCount, commentsCount, toggleLike } = usePostActions(catchId);

  const [showShareMenu, setShowShareMenu] = useState(false);
  const [saved, setSaved] = useState(initialSaved || false);
  const [showSavedSheet, setShowSavedSheet] = useState(false);
  const [highlightedCatchId, setHighlightedCatchId] = useState<string | null>(null);

  useEffect(() => {
    if (initialSaved !== undefined) {
      setSaved(initialSaved);
      return;
    }

    const checkSaved = async () => {
      if (!userId || !catchId) return;
      try {
        const response = await fetch(`/api/posts/save?catchId=${catchId}`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setSaved(data.isSaved || false);
        }
      } catch (error) {
        console.error("Error checking saved status:", error);
      }
    };
    checkSaved();
  }, [userId, catchId, initialSaved]);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) {
      router.push(`/login?next=/catch/${catchId}`);
      return;
    }
    toggleLike();
  };

  const handleComment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) {
      router.push(`/login?next=/catch/${catchId}`);
      return;
    }
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

  const openSavedSheet = () => {
    setHighlightedCatchId(catchId);
    setShowSavedSheet(true);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      router.push(`/login?next=/catch/${catchId}`);
      return;
    }

    const previousSaved = saved;
    setSaved(!saved);

    try {
      if (previousSaved) {
        const response = await fetch(`/api/posts/save?catchId=${catchId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          setSaved(previousSaved);
          const errorData = await response.json().catch(() => ({}));
          console.error("Failed to unsave post:", errorData.error || "Unknown error");
        }
      } else {
        const response = await fetch("/api/posts/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ catchId }),
        });

        if (response.ok || response.status === 409) {
          setSaved(true);
          openSavedSheet();
        } else {
          setSaved(previousSaved);
          const errorData = await response.json().catch(() => ({}));
          console.error("Failed to save post:", errorData.error || "Unknown error");
        }
      }
    } catch (error) {
      setSaved(previousSaved);
      console.error("Error saving post:", error);
    }
  };

  const handleSendMessage = () => {
    setShowShareMenu(false);
    const catchUrl = `${window.location.origin}/catch/${catchId}`;
    navigator.clipboard.writeText(catchUrl).then(() => {
      addNotification({
        message: "Link copied to clipboard!",
        type: "success",
      });
    });
  };

  return (
    <div className="relative">
      <div className="flex flex-col items-center gap-3 rounded-full bg-black/40 px-2 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={handleLike}
          className={`flex flex-col items-center gap-1 transition-colors ${
            liked ? "text-red-400" : "text-white/90 hover:text-red-400"
          }`}
        >
          <Heart size={20} className={liked ? "fill-red-400" : ""} />
          {likesCount > 0 && (
            <span className="text-xs font-semibold">{likesCount}</span>
          )}
        </button>

        <button
          type="button"
          onClick={handleComment}
          className="flex flex-col items-center gap-1 text-white/90 transition-colors hover:text-blue-400"
        >
          <MessageCircle size={20} />
          {commentsCount > 0 && (
            <span className="text-xs font-semibold">{commentsCount}</span>
          )}
        </button>

        {showViewCount && (
          <div
            className="flex flex-col items-center gap-1 text-white/70"
            aria-label={`${viewCount} views`}
          >
            <Eye size={20} />
            {viewCount > 0 && (
              <span className="text-xs font-semibold">{viewCount}</span>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          className={`flex flex-col items-center gap-1 transition-colors ${
            saved ? "text-yellow-400" : "text-white/90 hover:text-yellow-400"
          }`}
        >
          <Bookmark size={20} className={saved ? "fill-yellow-400" : ""} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={handleShare}
            className="flex flex-col items-center gap-1 text-white/90 transition-colors hover:text-blue-400"
          >
            <Share2 size={20} />
          </button>
          {showShareMenu && (
            <div className="absolute right-0 bottom-full z-50 mb-2 w-64 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl">
              <button
                type="button"
                onClick={handleSendMessage}
                className="flex w-full items-center gap-3 whitespace-nowrap px-4 py-3 text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                <MessageCircle size={18} />
                <span>Send as Message</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <SavedPostsSheet
        isOpen={showSavedSheet}
        onClose={() => setShowSavedSheet(false)}
        highlightCatchId={highlightedCatchId}
      />
    </div>
  );
};
