"use client";

import React, { useEffect, useRef, useState } from 'react';
import { AdBanner } from '@/components/AdBanner';
import { BottomNav } from '@/components/BottomNav';
import { CommentModal } from '@/components/CommentModal';
import { FeedPostCard } from '@/components/FeedPostCard';
import { NewsContent } from '@/components/NewsContent';
import { LeaderboardContent } from '@/components/LeaderboardContent';
import { FeedTabs } from '@/components/FeedTabs';
import { useI18n } from '@/lib/useI18n';
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useMotionValue, useTransform } from 'framer-motion';
import { useUserStore } from '@/stores/useUserStore';
import { useFeedStore } from '@/stores/useFeedStore';
import { useUIStore } from '@/stores/useUIStore';

interface HomePageClientProps {
    initialFeed: unknown[];
    initialUser: {
        id: string;
        isPro?: boolean;
        _count?: { following?: number };
    } | null;
}

export default function HomePageClient({ initialFeed, initialUser }: HomePageClientProps) {
    const { dict, mounted } = useI18n();
    const { currentUser, fetchUser } = useUserStore();
    const {
        feed,
        feedType,
        isTransitioning,
        scrollPosition,
        setFeedType,
        fetchFeed,
        setFeed,
        setScrollPosition,
        pendingView,
        setPendingView,
    } = useFeedStore();
    const { commentModalOpen, selectedPostForComment, openCommentModal, closeCommentModal } = useUIStore();
    const [currentView, setCurrentView] = useState<'feed' | 'news'>('feed');

    const initializedRef = useRef(false);

    useEffect(() => {
        if (!initializedRef.current) {
            if (Array.isArray(initialFeed)) {
                useFeedStore.setState({ feed: initialFeed, loading: false, feedType: 'all' });
            } else {
                useFeedStore.setState({ feed: [], loading: false, feedType: 'all' });
            }
            if (initialUser) {
                useUserStore.setState({
                    currentUser: initialUser as never,
                    userId: initialUser.id,
                    followingCount: initialUser._count?.following || 0,
                });
            }
            initializedRef.current = true;
        }
    }, [initialFeed, initialUser]);

    const { scrollY } = useScroll();
    const scrollYBounded = useMotionValue(0);
    const scrollYBoundedProgress = useTransform(scrollYBounded, [0, 100], [0, 1]);
    const bottomNavY = useTransform(scrollYBoundedProgress, [0, 1], [0, 100]);
    const topTabsY = useTransform(scrollYBoundedProgress, [0, 1], [0, -100]);

    useMotionValueEvent(scrollY, "change", (current) => {
        const previous = scrollY.getPrevious() || 0;
        const diff = current - previous;
        const newBounded = scrollYBounded.get() + diff;

        if (current < 50) {
            scrollYBounded.set(0);
        } else {
            const clamped = Math.min(Math.max(newBounded, 0), 100);
            scrollYBounded.set(clamped);
        }
    });

    const handleFeedTypeChange = (type: 'all' | 'news' | 'leaderboard') => {
        if (type === 'news' || type === 'leaderboard') {
            setCurrentView('news');
            return;
        }
        setCurrentView('feed');
        setFeedType('all');
        fetchFeed('all', true);
    };

    useEffect(() => {
        const checkUser = async () => {
            const { userId, currentUser: storedUser } = useUserStore.getState();
            if (userId && !storedUser) {
                await useUserStore.getState().fetchUser(userId);
            }
        };

        void checkUser();

        const restoreScroll = () => {
            if (scrollPosition > 0) {
                window.scrollTo(0, scrollPosition);
            }
        };

        restoreScroll();
        setTimeout(restoreScroll, 100);

        let rafId = 0;
        let lastWritten = -1;
        const handleScroll = () => {
            if (rafId) return;
            rafId = window.requestAnimationFrame(() => {
                rafId = 0;
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                // Avoid Zustand writes for tiny scroll jitter
                if (Math.abs(scrollTop - lastWritten) < 24) return;
                lastWritten = scrollTop;
                setScrollPosition(scrollTop);
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafId) window.cancelAnimationFrame(rafId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (pendingView) {
            setCurrentView(pendingView);
            setPendingView(null);
        }
    }, [pendingView, setPendingView]);

    const userIsPro = currentUser?.isPro ?? false;

    return (
        <div className="flex flex-col min-h-screen bg-zinc-950 pb-[120px] text-zinc-100">
            <FeedTabs
                currentView={currentView}
                feedType={feedType}
                onTabChange={handleFeedTypeChange}
                y={topTabsY}
            />

            <main className="flex-1 p-4 relative min-h-[400px] pt-16">
                <AnimatePresence mode="wait">
                    {currentView === 'news' ? (
                        <motion.div
                            key="news"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            <NewsContent />
                            <div className="pt-6 border-t border-zinc-800">
                                <LeaderboardContent />
                            </div>
                        </motion.div>
                    ) : isTransitioning ? (
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
                                className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full"
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="feed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4 w-full"
                        >
                            {Array.isArray(feed) && feed.map((item) => (
                                <div key={item.id}>
                                    <FeedPostCard
                                        item={item}
                                        currentUserId={currentUser?.id}
                                        onDeleteSuccess={() => {
                                            setFeed(feed.filter((f) => f.id !== item.id));
                                        }}
                                        onCommentClick={() => {
                                            if (!currentUser?.id) return;
                                            openCommentModal(item);
                                        }}
                                    />
                                </div>
                            ))}

                            {selectedPostForComment && currentUser?.id && (
                                <CommentModal
                                    isOpen={commentModalOpen}
                                    onClose={closeCommentModal}
                                    catchId={selectedPostForComment.id}
                                    postAuthor={selectedPostForComment.user}
                                    currentUserId={currentUser.id}
                                    onCommentAdded={() => {
                                        fetchFeed('all');
                                    }}
                                />
                            )}

                            {feed.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center text-zinc-500 py-10"
                                >
                                    {mounted ? dict.noCatches : 'No catches yet'}. {mounted ? dict.beFirst : 'Be the first to post!'}
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <AdBanner userIsPro={userIsPro} />

            <motion.div
                style={{ y: bottomNavY }}
                className="fixed bottom-0 left-0 right-0 z-50"
            >
                <BottomNav
                    feedType={feedType}
                    currentView={currentView}
                    onFeedTypeChange={handleFeedTypeChange}
                />
            </motion.div>
        </div>
    );
}
