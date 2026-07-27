"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/useI18n';
import { useUserStore } from '@/stores/useUserStore';
import { useFeedStore } from '@/stores/useFeedStore';
import { useModalStore } from '@/stores/useModalStore';
import { useCatchStore } from '@/stores/useCatchStore';
import { SwipeablePage } from '@/components/SwipeablePage';
import { BottomNav } from '@/components/BottomNav';
import { TelegramBackButton } from '@/components/TelegramBackButton';
import { PostActionsHorizontal } from '@/components/PostActionsHorizontal';
import { CommentModal } from '@/components/CommentModal';
import { useNotificationStore } from '@/stores/useNotificationStore';

import { shareCatch } from '@/lib/share';

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
        showFishDetailsId, setShowFishDetailsId,
        fullscreenImageSrc, setFullscreenImageSrc,
        commentModalOpen, setCommentModalOpen,
        showDetailsSheet, setShowDetailsSheet
    } = useModalStore();

    const [returnTo] = useState<string>(initialReturnTo);

    // Prefer server data when it arrives; keep provisional feed payload for instant paint
    useEffect(() => {
        if (initialCatchData) {
            setCatchData(initialCatchData);
        }
        setRelatedCatches(initialRelatedCatches || []);
        setLoading(false);
    }, [catchId, initialCatchData, initialRelatedCatches, setCatchData, setRelatedCatches, setLoading]);

    useEffect(() => {
        if (!catchId || !currentUserId) return;
        fetch(`/api/catch/${catchId}/view`, {
            method: 'POST',
            credentials: 'include',
        }).catch(() => undefined);
    }, [catchId, currentUserId]);

    const { comments, loadingComments, fetchComments } = useComments(catchId);

    const handleShare = async (id: string): Promise<void> => {
        const related = initialRelatedCatches.find((item: { id: string }) => item.id === id);
        const fish = related || (catchData?.id === id ? catchData : catchData);

        const result = await shareCatch({
            catchId: id,
            species: fish?.species ?? null,
        });

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

    const previousPageComponent = null;

    // While hydrating or if no data found (and not loading from client hook which we removed)
    if (!catchData && !initialCatchData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-950">
                <p className="text-zinc-400">{dict.catchNotFound || 'Catch not found'}</p>
            </div>
        );
    }

    // Use store data when it matches this catch (provisional feed paint), else SSR
    const displayData =
        catchData?.id === catchId ? catchData : initialCatchData;
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
                                handleShare={handleShare}
                                setShowFishDetailsId={setShowFishDetailsId}
                                onImageClick={setFullscreenImageSrc}
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
                    species={displayData.species}
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

