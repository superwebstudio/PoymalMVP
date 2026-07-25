"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/useI18n';
import { useUserStore } from '@/stores/useUserStore';
import { useFeedStore } from '@/stores/useFeedStore';
import { useModalStore } from '@/stores/useModalStore';
import { useCatchStore } from '@/stores/useCatchStore';
import { SwipeablePage } from '@/components/SwipeablePage';
import { FeedPageContent } from '@/components/FeedPageContent';
import ProfilePageClient from '@/app/profile/page.client';
import { BottomNav } from '@/components/BottomNav';
import { TelegramBackButton } from '@/components/TelegramBackButton';
import { PostActionsHorizontal } from '@/components/PostActionsHorizontal';
import { CommentModal } from '@/components/CommentModal';
import { useNotificationStore } from '@/stores/useNotificationStore';

import { useComments } from '@/hooks/useComments';
import { usePostStore } from '@/stores/usePostStore';

import { CatchHeader } from '@/components/CatchDetailPage/CatchHeader';
import { FishCarousel } from '@/components/CatchDetailPage/FishCarousel';
import { CatchInfo } from '@/components/CatchDetailPage/CatchInfo';
import { CommentsList } from '@/components/CatchDetailPage/CommentsList';
import { CatchDetailsModal } from '@/components/CatchDetailPage/modals/CatchDetailsModal';
import { FishDetailsModal } from '@/components/CatchDetailPage/modals/FishDetailsModal';
import { FullscreenImage } from '@/components/CatchDetailPage/modals/FullscreenImage';

interface CatchDetailPageClientProps {
    catchId: string;
    initialCatchData: any | null;
    initialRelatedCatches: any[];
    initialReturnTo: string;
}

export default function CatchDetailPageClient({ catchId, initialCatchData, initialRelatedCatches, initialReturnTo }: CatchDetailPageClientProps) {
    const { dict, mounted } = useI18n();
    const router = useRouter();
    const { userId: currentUserId } = useUserStore();
    const { scrollPosition, setScrollPosition } = useFeedStore();
    const { catchData, setCatchData, setRelatedCatches, setLoading } = useCatchStore();
    const { addNotification } = useNotificationStore();
    // Post like state is handled by usePostActions hook in PostActionsHorizontal

    // Modal Store
    const {
        activeShareId, setActiveShareId,
        showFishDetailsId, setShowFishDetailsId,
        fullscreenImageSrc, setFullscreenImageSrc,
        commentModalOpen, setCommentModalOpen,
        showDetailsSheet, setShowDetailsSheet
    } = useModalStore();

    const [returnTo] = useState<string>(initialReturnTo);

    // Hydrate Catch Store (NOT post/like store - that's handled by usePostActions)
    const initializedRef = useRef(false);
    useEffect(() => {
        if (!initializedRef.current) {
            if (initialCatchData) {
                setCatchData(initialCatchData);
            }
            if (initialRelatedCatches) {
                setRelatedCatches(initialRelatedCatches);
            }
            setLoading(false);
            initializedRef.current = true;
        }
    }, [initialCatchData, initialRelatedCatches, setCatchData, setRelatedCatches, setLoading]);

    useEffect(() => {
        if (!catchId || !currentUserId) return;
        fetch(`/api/catch/${catchId}/view`, {
            method: 'POST',
            credentials: 'include',
        }).catch(() => undefined);
    }, [catchId, currentUserId]);

    const { comments, loadingComments, fetchComments } = useComments(catchId);
    const shareMenuRef = useRef<HTMLDivElement>(null);

    // Click outside share menu
    useEffect(() => {
        if (!activeShareId) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
                setActiveShareId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeShareId, setActiveShareId]);

    const handleShare = (id: string) => {
        setActiveShareId(activeShareId === id ? null : id);
    };

    const handleSendMessage = () => {
        setActiveShareId(null);
        if (!catchData) return;

        const catchUrl = `${window.location.origin}/catch/${catchId}`;
        const shareText = catchData.species
            ? `Check out this ${catchData.species} catch! ${catchUrl}`
            : `Check out this catch! ${catchUrl}`;

        // Prioritize Telegram Mini App native share (opens contact picker in-app)
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            // Use https://t.me/share/url format which works in Mini Apps
            const telegramShareLink = `https://t.me/share/url?url=${encodeURIComponent(catchUrl)}&text=${encodeURIComponent(shareText)}`;

            // Use openTelegramLink to open within Telegram without leaving Mini App
            if ((tg as any).openTelegramLink) {
                (tg as any).openTelegramLink(telegramShareLink);
            } else if ((tg as any).openLink) {
                // Fallback to openLink (also works in Mini App)
                (tg as any).openLink(telegramShareLink);
            } else {
                // Last resort: open in same window
                window.open(telegramShareLink, '_blank');
            }
        } else if (typeof navigator !== 'undefined' && navigator.share) {
            // Use native Web Share API if available (works in-app without opening browser)
            navigator.share({
                title: catchData.species ? `${catchData.species} Catch` : 'Catch',
                text: shareText,
                url: catchUrl,
            }).catch((error) => {
                // User cancelled or error occurred, fallback to clipboard
                if (error.name !== 'AbortError') {
                    navigator.clipboard.writeText(shareText).then(() => {
                        addNotification({
                            message: 'Link copied to clipboard!',
                            type: 'success',
                        });
                    }).catch(() => {
                        addNotification({
                            message: 'Failed to copy link',
                            type: 'error',
                        });
                    });
                }
            });
        } else {
            // Final fallback: copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                addNotification({
                    message: 'Link copied to clipboard!',
                    type: 'success',
                });
            }).catch(() => {
                addNotification({
                    message: 'Failed to copy link',
                    type: 'error',
                });
            });
        }
    };

    const handleSwipeComplete = () => {
        if (returnTo === '/') {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            setScrollPosition(scrollTop);
        }
        router.push(returnTo);
        if (returnTo === '/') {
            setTimeout(() => {
                if (scrollPosition > 0) {
                    window.scrollTo(0, scrollPosition);
                }
            }, 100);
        }
    };

    const methodTranslations: Record<string, string> = {
        'Spinning': dict.spinning,
        'Fly fishing': dict.flyFishing,
        'Bottom fishing': dict.bottomFishing,
        'Jigging': dict.jigging,
        'Trolling': dict.trolling,
        'Float fishing': dict.floatFishing,
    };

    const previousPageComponent = returnTo === '/profile' ? (
        <ProfilePageClient initialUser={null} />
    ) : (
        <FeedPageContent
            scrollPosition={scrollPosition}
            onScroll={(scrollTop) => {
                if (returnTo === '/') {
                    setScrollPosition(scrollTop);
                }
            }}
        />
    );

    // While hydrating or if no data found (and not loading from client hook which we removed)
    if (!catchData && !initialCatchData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-950">
                <p className="text-zinc-400">{dict.catchNotFound || 'Catch not found'}</p>
            </div>
        );
    }

    // Use store data (which is hydrated)
    const displayData = catchData || initialCatchData;
    const isOwner = displayData?.userId === currentUserId;

    // Derive allCatches for carousel if needed
    // Combine catchData with relatedCatches for carousel display
    const derivedAllCatches = displayData
        ? [displayData, ...(initialRelatedCatches || [])].filter(item => item && item.id)
        : [];

    return (
        <SwipeablePage
            previousPageComponent={previousPageComponent}
            onSwipeComplete={handleSwipeComplete}
        >
            <TelegramBackButton fallbackUrl={returnTo} />

            <div className="p-4 space-y-4 pb-24" style={{ minHeight: '100vh', paddingBottom: 'max(6rem, calc(6rem + env(safe-area-inset-bottom)))' }}>
                <CatchHeader
                    catchData={displayData}
                    isOwner={isOwner}
                    router={router}
                />

                {displayData.isTextOnly ? (
                    <div className="rounded-xl p-6 relative">
                        <p className="text-zinc-100 text-lg leading-relaxed whitespace-pre-wrap">
                            {displayData.description || ''}
                        </p>
                    </div>
                ) : (
                    <>
                        {(initialRelatedCatches.length > 0 || displayData.species || displayData.imageUrl) && (
                            <FishCarousel
                                allCatches={derivedAllCatches}
                                activeShareId={activeShareId}
                                handleShare={handleShare}
                                handleSendMessage={handleSendMessage}
                                setShowFishDetailsId={setShowFishDetailsId}
                                onImageClick={setFullscreenImageSrc}
                                shareMenuRef={shareMenuRef}
                                dict={dict}
                                description={displayData.description}
                            />
                        )}

                        {derivedAllCatches.length === 0 && !displayData.imageUrl && displayData.species && (
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-100">{displayData.species}</h2>
                                {displayData.scientificName && <p className="text-sm text-zinc-500 italic mt-1">{displayData.scientificName}</p>}
                                {displayData.description && <p className="text-zinc-400 mt-2">{displayData.description}</p>}
                            </div>
                        )}
                    </>
                )}

                <CatchInfo
                    catchData={displayData}
                    dict={dict}
                    setShowDetailsSheet={setShowDetailsSheet}
                />

                <PostActionsHorizontal
                    catchId={displayData.id}
                    onCommentClick={() => setCommentModalOpen(true)}
                />

                <CommentsList
                    comments={comments}
                    loadingComments={loadingComments}
                    currentUserId={currentUserId}
                    dict={dict}
                    catchId={catchId}
                    onCommentsChange={fetchComments}
                    setCatchData={setCatchData}
                />
            </div>

            <CatchDetailsModal
                catchData={displayData}
                isOpen={showDetailsSheet}
                onClose={() => setShowDetailsSheet(false)}
                dict={dict}
            />

            <FishDetailsModal
                fish={derivedAllCatches.find((c: any) => c.id === showFishDetailsId)}
                isOpen={!!showFishDetailsId}
                onClose={() => setShowFishDetailsId(null)}
                dict={dict}
                methodTranslations={methodTranslations}
            />

            {fullscreenImageSrc && (
                <FullscreenImage
                    imageUrl={fullscreenImageSrc}
                    species={displayData.species}
                    onClose={() => setFullscreenImageSrc(null)}
                />
            )}

            {displayData && (
                <CommentModal
                    isOpen={commentModalOpen}
                    onClose={() => setCommentModalOpen(false)}
                    catchId={displayData.id}
                    postAuthor={displayData.user}
                    currentUserId={currentUserId || undefined}
                    onCommentAdded={async () => {
                        // Only refetch comments, update catch data optimistically
                        // The catch data itself doesn't change when a comment is added
                        await fetchComments();
                        // Optimistically update comment count
                        if (catchData) {
                            setCatchData({
                                ...catchData,
                                _count: {
                                    ...catchData._count,
                                    comments: (catchData._count?.comments || 0) + 1,
                                },
                            });
                        }
                    }}
                />
            )}

            <BottomNav />
        </SwipeablePage>
    );
}

