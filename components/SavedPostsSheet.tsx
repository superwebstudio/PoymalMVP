"use client";

import React, { useEffect, useState } from "react";
import { Sheet } from "react-modal-sheet";
import { Bookmark, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/useI18n";
import { Backdrop } from "@/components/ui/Backdrop";
import { CachedImage } from "@/components/CachedImage";

interface SavedPost {
  id: string;
  imageUrl?: string | null;
  species?: string | null;
  description?: string | null;
  isTextOnly?: boolean;
}

interface SavedPostsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  highlightCatchId?: string | null;
}

export function SavedPostsSheet({
  isOpen,
  onClose,
  highlightCatchId = null,
}: SavedPostsSheetProps): React.ReactElement {
  const { dict } = useI18n();
  const router = useRouter();
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowContent(false);
      return;
    }

    const timer = setTimeout(() => setShowContent(true), 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const fetchSaved = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/posts/saved", {
          credentials: "include",
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setPosts(data.posts || []);
        }
      } catch (error) {
        console.error("Error fetching saved posts:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSaved();
    return () => {
      cancelled = true;
    };
  }, [isOpen, highlightCatchId]);

  const handlePostClick = (postId: string) => {
    onClose();
    router.push(`/catch/${postId}`);
  };

  return (
    <>
      <Backdrop isOpen={isOpen} onClose={onClose} blur={false} zIndex={40} />

      {showContent && (
        <Sheet
          isOpen={isOpen}
          onClose={onClose}
          snapPoints={[0, 0.5, 1]}
          initialSnap={1}
        >
          <Sheet.Container
            className="!border !border-zinc-800 !bg-zinc-900/95 !backdrop-blur-md"
            style={{
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              zIndex: 50,
            }}
          >
            <Sheet.Header>
              <div className="flex justify-center py-3">
                <div className="h-1.5 w-12 rounded-full bg-zinc-600" />
              </div>
              <div className="flex items-center justify-between px-4 pb-3">
                <div className="flex items-center gap-2">
                  <Bookmark size={18} className="fill-yellow-400 text-yellow-400" />
                  <h3 className="text-lg font-bold text-zinc-100">
                    {dict.savedPosts || "Saved Posts"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800"
                >
                  <X size={20} />
                </button>
              </div>
            </Sheet.Header>

            <Sheet.Content className="px-4 pb-6">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-transparent" />
                </div>
              ) : posts.length === 0 ? (
                <div className="py-10 text-center text-sm text-zinc-500">
                  {dict.noSavedPosts || "No saved posts yet"}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {posts.map((post) => {
                    const isHighlighted = post.id === highlightCatchId;
                    return (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => handlePostClick(post.id)}
                        className={`relative aspect-square overflow-hidden rounded-xl text-left ${
                          isHighlighted
                            ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-zinc-900"
                            : ""
                        }`}
                      >
                        {post.imageUrl ? (
                          <CachedImage
                            src={post.imageUrl}
                            alt={post.species || "Saved catch"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-zinc-800 px-2">
                            <p className="line-clamp-3 text-center text-xs text-zinc-400">
                              {post.description || post.species || "Post"}
                            </p>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          {post.species && (
                            <p className="truncate text-xs font-medium text-white">
                              {post.species}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <Link
                href="/saved"
                onClick={onClose}
                className="mt-4 block w-full rounded-xl bg-zinc-800 py-3 text-center text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
              >
                {dict.viewAllSaved || "View all saved"}
              </Link>
            </Sheet.Content>
          </Sheet.Container>
        </Sheet>
      )}
    </>
  );
}
