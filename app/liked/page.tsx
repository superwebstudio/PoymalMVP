"use client";

import React, { useEffect, useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { TelegramBackButton } from '@/components/TelegramBackButton';
import { useI18n } from '@/lib/useI18n';
import { useUserStore } from '@/stores/useUserStore';
import { Grid3x3, List, X } from 'lucide-react';
import { FeedPostCard } from '@/components/FeedPostCard';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CachedImage } from '@/components/CachedImage';

interface Post {
  id: string;
  userId: string;
  imageUrl?: string | null;
  species?: string | null;
  scientificName?: string | null;
  description?: string | null;
  isTextOnly?: boolean;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    username: string | null;
    photoUrl: string | null;
    isPro: boolean;
    country: string | null;
  };
  likesCount: number;
  commentsCount: number;
  likedAt?: string;
}

export default function LikedPostsPage() {
  const { dict } = useI18n();
  const { userId } = useUserStore();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLikedPosts = async () => {
      if (!userId) return;

      try {
        const response = await fetch('/api/posts/liked', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || []);
        }
      } catch (error) {
        console.error('Error fetching liked posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedPosts();
  }, [userId]);

  const handlePostClick = (postId: string) => {
    if (viewMode === 'grid') {
      setSelectedPostId(postId);
      setViewMode('list');
      // Scroll to the selected post
      setTimeout(() => {
        const element = document.getElementById(`post-${postId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else {
      router.push(`/catch/${postId}`);
    }
  };

  const handleBackToList = () => {
    setViewMode('grid');
    setSelectedPostId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      <TelegramBackButton />
      
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <h1 className="text-xl font-bold">{dict.likedPosts || 'Liked Posts'}</h1>
        {viewMode === 'list' && (
          <button
            onClick={handleBackToList}
            className="p-2 rounded-full hover:bg-zinc-800"
          >
            <X size={20} className="text-zinc-400" />
          </button>
        )}
        {viewMode === 'grid' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className="p-2 rounded-lg bg-sky-600 text-white"
            >
              <Grid3x3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="p-2 rounded-lg bg-zinc-800 text-zinc-400"
            >
              <List size={18} />
            </button>
          </div>
        )}
      </header>

      {/* Content */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            <p className="text-zinc-400 text-lg mb-2">{dict.noLikedPosts || 'No liked posts yet'}</p>
            <p className="text-zinc-500 text-sm">{dict.startLikingPosts || 'Start liking posts you enjoy!'}</p>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => handlePostClick(post.id)}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
              >
                {post.imageUrl ? (
                  <CachedImage
                    src={post.imageUrl}
                    alt={post.species || 'Catch'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <p className="text-zinc-500 text-sm text-center px-2">{post.description || post.species || 'Post'}</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  {post.species && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-sm font-semibold truncate">{post.species}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div 
          className="overflow-y-auto h-[calc(100vh-120px)]"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="p-4 space-y-4">
            <AnimatePresence mode="popLayout">
              {posts.map((post, index) => {
                const feedPostItem = {
                  id: post.id,
                  userId: post.userId,
                  user: post.user,
                  species: post.species,
                  imageUrl: post.imageUrl,
                  description: post.description,
                  isTextOnly: post.isTextOnly,
                  createdAt: post.createdAt,
                  _count: {
                    likes: post.likesCount,
                    comments: post.commentsCount,
                  },
                  reactions: [],
                  isPinned: false,
                };

                return (
                  <motion.div
                    key={post.id}
                    id={`post-${post.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handlePostClick(post.id)}
                  >
                    <FeedPostCard
                      item={feedPostItem}
                      currentUserId={userId}
                      showReplyIndicator={false}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

