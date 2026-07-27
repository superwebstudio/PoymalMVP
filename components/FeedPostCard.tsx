"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, Pin } from 'lucide-react';
import { PostActions } from '@/components/PostActions';
import { PostMenu } from '@/components/PostMenu';
import { useI18n } from '@/lib/useI18n';
import { useFeedStore } from '@/stores/useFeedStore';
import { usePostStore } from '@/stores/usePostStore';
import { useCatchStore } from '@/stores/useCatchStore';
import { CachedImage } from '@/components/CachedImage';
import { ProAvatarBadge } from '@/components/ProAvatarBadge';

interface User {
  id: string;
  firstName?: string | null;
  username?: string | null;
  photoUrl?: string | null;
  isPro?: boolean;
}

interface FeedPostCardProps {
  item: {
    id: string;
    userId: string;
    user: User;
    species?: string | null;
    imageUrl?: string | null;
    description?: string | null;
    isTextOnly?: boolean;
    postType?: string | null;
    baitMixData?: {
      mixName?: string;
      ingredients?: Array<{ name: string; amount: string; unit: string; customUnit?: string | null }>;
      notes?: string | null;
      targetSpecies?: string[];
      waterTempRange?: string | null;
      seasons?: string[];
    } | null;
    createdAt: Date | string;
    _count?: {
      likes?: number;
      comments?: number;
      views?: number;
    };
    reactions?: Array<{
      userId: string;
      emoji: string;
    }>;
    isPinned?: boolean;
    surfacedFromReply?: boolean;
    replyFrom?: User;
    allImages?: string[]; // Array of image URLs for carousel
    relatedCatches?: any[]; // Related catches in the same post
    isSaved?: boolean; // Saved status from feed (to avoid N+1 queries)
  };
  currentUserId?: string | null;
  onDeleteSuccess?: () => void;
  onCommentClick?: () => void;
  showReplyIndicator?: boolean;
  onPinChange?: () => void;
}

export const FeedPostCard: React.FC<FeedPostCardProps> = ({
  item,
  currentUserId,
  onDeleteSuccess,
  onCommentClick,
  showReplyIndicator = true,
  onPinChange,
}) => {
  const { dict } = useI18n();
  const router = useRouter();
  const { setScrollPosition } = useFeedStore();
  const { setCatchData, setLoading } = useCatchStore();
  const { initializePost } = usePostStore();
  const isTextOnly = item.isTextOnly || false;
  const isBaitMix = item.postType === 'bait_mix';
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Get all images for carousel
  const allImages = item.allImages || (item.imageUrl ? [item.imageUrl] : []);
  const hasMultipleImages = allImages.length > 1;
  const isOwnPost = Boolean(currentUserId && currentUserId === item.userId);
  const viewCount = item._count?.views ?? 0;

  // Initialize post data in store - ONCE per item (not on every render)
  const initializedRef = useRef<string | null>(null);

  React.useEffect(() => {
    // Only initialize once per unique item.id
    if (initializedRef.current !== item.id) {
      initializedRef.current = item.id;
      initializePost(item.id, {
        likesCount: item._count?.likes || 0,
        commentsCount: item._count?.comments || 0,
        isLiked: item.reactions?.some((r) => r.userId === currentUserId) || false,
        species: item.species || undefined,
        imageUrl: item.imageUrl || undefined,
      });
    }
  }, [item.id, item._count?.likes, item._count?.comments, item.reactions, currentUserId, item.species, item.imageUrl, initializePost]);

  // Handle carousel scroll to update index
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || !hasMultipleImages) return;

    const handleScroll = () => {
      const index = Math.round(carousel.scrollLeft / carousel.offsetWidth);
      if (index !== currentImageIndex && index >= 0 && index < allImages.length) {
        setCurrentImageIndex(index);
        // Update data attribute for SwipeablePage detection
        const container = carousel.closest('[data-carousel-container]') as HTMLElement;
        if (container) {
          container.setAttribute('data-carousel-index', index.toString());
        }
      }
    };

    carousel.addEventListener('scroll', handleScroll);
    // Also check on touch end to ensure index is updated
    const handleTouchEnd = () => {
      requestAnimationFrame(() => {
        const index = Math.round(carousel.scrollLeft / carousel.offsetWidth);
        if (index !== currentImageIndex && index >= 0 && index < allImages.length) {
          setCurrentImageIndex(index);
          const container = carousel.closest('[data-carousel-container]') as HTMLElement;
          if (container) {
            container.setAttribute('data-carousel-index', index.toString());
          }
        }
      });
    };
    carousel.addEventListener('touchend', handleTouchEnd);

    return () => {
      carousel.removeEventListener('scroll', handleScroll);
      carousel.removeEventListener('touchend', handleTouchEnd);
    };
  }, [hasMultipleImages, allImages.length, currentImageIndex]);

  // Handle touch events for swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - touchStartX.current;
    const deltaY = touchY - touchStartY.current;

    // If we have multiple images and we're NOT on the first image, prevent feed swipe
    // Also prevent if we're swiping horizontally within the carousel
    if (hasMultipleImages) {
      if (currentImageIndex > 0 && deltaX > 0 && Math.abs(deltaX) > Math.abs(deltaY)) {
        // Swiping right on non-first image - prevent feed swipe, allow carousel navigation
        e.stopPropagation();
        e.preventDefault();
      } else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        // Any horizontal swipe within carousel - prevent feed swipe
        e.stopPropagation();
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Continue preventing if we're not on first image
    if (hasMultipleImages && currentImageIndex > 0) {
      e.stopPropagation();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Removed handleImageClick - images are now clickable to navigate to catch details

  const handlePostClick = () => {
    // Save scroll position immediately when clicking on a post
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    setScrollPosition(scrollTop);
  };

  const openCatch = (): void => {
    handlePostClick();
    // Instant paint with feed payload while the detail route loads
    setCatchData(item as never);
    setLoading(false);
    router.prefetch(`/catch/${item.id}`);
    router.push(`/catch/${item.id}`);
  };

  return (
    <div className="relative mb-6 w-full">
      <div className="relative w-full">
        {/* Show indicator if post was surfaced from a reply */}
        {showReplyIndicator && item.surfacedFromReply && item.replyFrom && (
          <div className="mb-2 px-3 py-2 bg-sky-500/10 border border-sky-500/20 rounded-lg flex items-center gap-2 text-xs text-sky-400">
            <MessageCircle size={14} />
            <span>
              {item.replyFrom.firstName || item.replyFrom.username || 'Someone'} {(dict as any).repliedToThis || 'replied to this'}
            </span>
          </div>
        )}

        {/* Wrapper for entire post */}
        <div
          onClick={openCatch}
          onMouseEnter={() => router.prefetch(`/catch/${item.id}`)}
          onTouchStart={() => router.prefetch(`/catch/${item.id}`)}
          className="block cursor-pointer"
        >
          {/* Post Content */}
          {isBaitMix ? (
            // Bait Mix Post
            <div className="relative bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-4 mb-3 border border-zinc-800/50">
              {/* User Header */}
              <div className="flex items-center justify-between mb-3">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/user/${item.user.id}`);
                  }}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="relative w-8 h-8">
                    <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden">
                      {item.user.photoUrl ? (
                        <CachedImage
                          src={item.user.photoUrl}
                          alt={item.user.username || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">?</div>
                      )}
                    </div>
                    {item.user.isPro && <ProAvatarBadge />}
                  </div>
                  <div className="text-sm font-semibold text-zinc-200">
                    {item.user.firstName || item.user.username || 'Unknown Angler'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.isPinned && (
                    <div className="bg-black/40 backdrop-blur-md rounded-full p-1.5">
                      <Pin size={14} className="text-yellow-400" />
                    </div>
                  )}
                  <div className="text-xs text-white/80 bg-black/40 backdrop-blur-md rounded-full px-2 py-1">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                  {currentUserId && currentUserId === item.userId && (
                    <div onClick={(e) => e.stopPropagation()} className="bg-black/40 backdrop-blur-md rounded-full">
                      <PostMenu
                        catchId={item.id}
                        userId={item.userId}
                        isPinned={item.isPinned || false}
                        onDeleteSuccess={onDeleteSuccess}
                        onPinSuccess={onPinChange}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Bait Mix Badge */}
              <div className="mb-3">
                <span className="inline-flex items-center gap-1.5 bg-sky-600/20 text-sky-300 px-3 py-1 rounded-full text-xs font-medium border border-sky-600/50">
                  🎣 {dict.baitMix || 'Bait Mix'}
                </span>
              </div>

              {/* Mix Name */}
              {item.baitMixData?.mixName && (
                <h3 className="text-lg font-bold text-white mb-3">
                  {item.baitMixData.mixName}
                </h3>
              )}

              {/* Image */}
              {item.imageUrl && (
                <div className="mb-3 rounded-lg overflow-hidden">
                  <CachedImage
                    src={item.imageUrl}
                    alt={item.baitMixData?.mixName || 'Bait mix'}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              {/* Ingredients */}
              {item.baitMixData?.ingredients && item.baitMixData.ingredients.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-zinc-300 mb-2">{dict.ingredients || 'Ingredients'}:</h4>
                  <div className="space-y-1.5">
                    {item.baitMixData.ingredients.map((ing, idx) => {
                      const displayUnit = ing.unit === 'other' && ing.customUnit ? ing.customUnit : ing.unit;
                      return (
                        <div key={idx} className="text-sm text-zinc-400 bg-zinc-800/50 rounded-lg px-3 py-2">
                          <span className="font-medium text-zinc-300">{ing.name}</span>
                          {ing.amount && (
                            <span className="text-zinc-500"> - {ing.amount} {displayUnit}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Target Species */}
              {item.baitMixData?.targetSpecies && item.baitMixData.targetSpecies.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-zinc-300 mb-2">{dict.targetSpecies || 'Target Species'}:</h4>
                  <div className="flex flex-wrap gap-2">
                    {item.baitMixData.targetSpecies.map((species, idx) => (
                      <span key={idx} className="bg-sky-600/20 text-sky-300 px-2 py-1 rounded text-xs border border-sky-600/50">
                        {species}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Water Temp & Seasons */}
              {(item.baitMixData?.waterTempRange || (item.baitMixData?.seasons && item.baitMixData.seasons.length > 0)) && (
                <div className="mb-3 flex flex-wrap gap-3 text-sm text-zinc-400">
                  {item.baitMixData.waterTempRange && (
                    <span>🌡️ {item.baitMixData.waterTempRange}</span>
                  )}
                  {item.baitMixData.seasons && item.baitMixData.seasons.length > 0 && (
                    <span>📅 {item.baitMixData.seasons.join(', ')}</span>
                  )}
                </div>
              )}

              {/* Notes */}
              {item.baitMixData?.notes && (
                <div className="mb-3">
                  <p className="text-sm text-zinc-400 whitespace-pre-wrap">{item.baitMixData.notes}</p>
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800" onClick={(e) => e.stopPropagation()}>
                <PostActions
                  catchId={item.id}
                  onCommentClick={onCommentClick}
                  initialSaved={(item as any).isSaved}
                  viewCount={viewCount}
                  showViewCount={isOwnPost}
                  species={item.species}
                />
              </div>
            </div>
          ) : isTextOnly ? (
            // Twitter-style text post
            <div className="relative bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-4 mb-3 border border-zinc-800/50">
              {/* User Header for text posts */}
              <div className="flex items-center justify-between mb-3">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/user/${item.user.id}`);
                  }}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="relative w-8 h-8">
                    <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden">
                      {item.user.photoUrl ? (
                        <CachedImage
                          src={item.user.photoUrl}
                          alt={item.user.username || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">?</div>
                      )}
                    </div>
                    {item.user.isPro && <ProAvatarBadge />}
                  </div>
                  <div className="text-sm font-semibold text-zinc-200">
                    {item.user.firstName || item.user.username || 'Unknown Angler'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.isPinned && (
                    <Pin size={14} className="text-yellow-400" />
                  )}
                  <div className="text-xs text-zinc-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                  {currentUserId && currentUserId === item.userId && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <PostMenu
                        catchId={item.id}
                        userId={item.userId}
                        isPinned={item.isPinned || false}
                        onDeleteSuccess={onDeleteSuccess}
                        onPinSuccess={onPinChange}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-3">
                <p className="text-zinc-100 text-base leading-relaxed whitespace-pre-wrap">
                  {item.description || ''}
                </p>
              </div>
            </div>
          ) : (
            // Regular catch post with image carousel - Edge to edge
            <>
              <div
                className="relative w-full bg-zinc-800 overflow-hidden rounded-2xl"
                style={{ aspectRatio: '4/3' }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                data-carousel-container="true"
                data-carousel-index={currentImageIndex}
              >
                {/* User Header - Floating over image */}
                <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/user/${item.user.id}`);
                    }}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5"
                  >
                    <div className="relative w-8 h-8">
                      <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden ring-2 ring-white/20">
                        {item.user.photoUrl ? (
                          <CachedImage
                            src={item.user.photoUrl}
                            alt={item.user.username || 'User'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">?</div>
                        )}
                      </div>
                      {item.user.isPro && <ProAvatarBadge />}
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {item.user.firstName || item.user.username || 'Unknown Angler'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.isPinned && (
                      <div className="bg-black/40 backdrop-blur-md rounded-full p-1.5">
                        <Pin size={14} className="text-yellow-400" />
                      </div>
                    )}
                    <div className="text-xs text-white/80 bg-black/40 backdrop-blur-md rounded-full px-2 py-1">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                    {currentUserId && currentUserId === item.userId && (
                      <div onClick={(e) => e.stopPropagation()} className="bg-black/40 backdrop-blur-md rounded-full">
                        <PostMenu
                          catchId={item.id}
                          userId={item.userId}
                          isPinned={item.isPinned || false}
                          onDeleteSuccess={onDeleteSuccess}
                          onPinSuccess={onPinChange}
                        />
                      </div>
                    )}
                  </div>
                </div>
                {hasMultipleImages ? (
                  <>
                    <div
                      ref={carouselRef}
                      className="flex overflow-x-auto snap-x snap-mandatory h-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                      style={{ scrollbarWidth: 'none' }}
                      onTouchStart={(e) => {
                        if (currentImageIndex > 0) {
                          e.stopPropagation();
                        }
                      }}
                      onTouchMove={(e) => {
                        if (currentImageIndex > 0 || hasMultipleImages) {
                          e.stopPropagation();
                        }
                      }}
                    >
                      {allImages.map((imageUrl, idx) => (
                        <div
                          key={idx}
                          className="min-w-full snap-center relative"
                        >
                          <CachedImage
                            src={imageUrl}
                            alt={item.species || 'Catch'}
                            className="w-full h-full object-cover"
                          />
                          {/* Gradient tint from bottom to half */}
                          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)' }} />
                          {item.species && idx === 0 && (
                            <div className="absolute bottom-16 left-3 text-white px-4 py-2 rounded-xl text-xl font-bold pointer-events-none z-10">
                              {item.species}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Dots Indicator */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
                      {allImages.map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-white' : 'bg-white/40'
                            }`}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {item.imageUrl ? (
                      <>
                        <CachedImage
                          src={item.imageUrl}
                          alt={item.species || 'Catch'}
                          className="w-full h-full object-cover"
                        />
                        {/* Gradient tint from bottom to half */}
                        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)' }} />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500">
                        <p className="text-sm">{dict.textPost}</p>
                      </div>
                    )}
                    {item.species && item.imageUrl && (
                      <div className="absolute bottom-16 left-3 text-white px-4 py-2 rounded-xl text-xl font-bold pointer-events-none z-10">
                        {item.species}
                      </div>
                    )}
                  </>
                )}

                {/* Description - Floating at bottom with gradient background */}
                {item.description && (
                  <div className="absolute bottom-3 left-3 right-20 z-10">
                    <p className="text-sm text-white/90 rounded-xl px-3 py-2 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Post Actions - Floating over image */}
                <div className="absolute bottom-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                  <PostActions
                    catchId={item.id}
                    onCommentClick={onCommentClick}
                    initialSaved={(item as any).isSaved}
                    viewCount={viewCount}
                    showViewCount={isOwnPost}
                    species={item.species}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

