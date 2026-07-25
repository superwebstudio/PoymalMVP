"use client";

import React, { useEffect, useRef, useState } from 'react';
import { AdBanner } from '@/components/AdBanner';
import { BottomNav } from '@/components/BottomNav';
import { Compass } from 'lucide-react';
import Link from 'next/link';
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
    initialFeed: any[];
    initialUser: any;
}

export default function HomePageClient({ initialFeed, initialUser }: HomePageClientProps) {
    const { dict, mounted } = useI18n();
    const { currentUser, followingCount, setCurrentUser, fetchUser } = useUserStore();
    const { feed, feedType, isTransitioning, scrollPosition, setFeedType, fetchFeed, setFeed, setScrollPosition, pendingView, setPendingView } = useFeedStore();
    const { commentModalOpen, selectedPostForComment, openCommentModal, closeCommentModal } = useUIStore();
    const [currentView, setCurrentView] = useState<'feed' | 'news'>('feed');

    // Hydrate stores with initial data
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!initializedRef.current) {
            if (initialFeed) {
                useFeedStore.setState({ feed: initialFeed });
            }
            if (initialUser) {
                useUserStore.setState({
                    currentUser: initialUser,
                    followingCount: initialUser._count?.following || 0
                });
            }
            initializedRef.current = true;
        }
    }, [initialFeed, initialUser]);

    // Scroll logic for bottom nav and top tabs
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

    const handleFeedTypeChange = (type: 'all' | 'following' | 'news' | 'leaderboard') => {
        if (type === 'news') {
            setCurrentView('news');
        } else if (type === 'leaderboard') {
            // Leaderboard is now part of news view, so switch to news
            setCurrentView('news');
        } else {
            setCurrentView('feed');
            setFeedType(type);
            fetchFeed(type, true);
        }
    };

    useEffect(() => {
        // If we didn't get an initial user (e.g. fresh load), try to fetch if we have an ID
        // We use a ref or check against the store state directly to avoid dependency loops
        const checkUser = async () => {
            const { userId, currentUser } = useUserStore.getState();
            if (userId && !currentUser) {
                await useUserStore.getState().fetchUser(userId);
            }
        };

        checkUser();

        // Restore scroll position
        const restoreScroll = () => {
            if (scrollPosition > 0) {
                window.scrollTo(0, scrollPosition);
            }
        };

        restoreScroll();
        setTimeout(restoreScroll, 100);

        const handleScroll = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            setScrollPosition(scrollTop);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array to run only once on mount

    // Handle pending view from navigation (e.g., from menu on other pages)
    useEffect(() => {
        if (pendingView) {
            setCurrentView(pendingView);
            setPendingView(null); // Clear after applying
        }
    }, [pendingView, setPendingView]);


    const userIsPro = currentUser?.isPro ?? false;
    const showFollowingEmpty = feedType === 'following' && followingCount === 0;

    return (
        <div className="flex flex-col min-h-screen bg-zinc-950 pb-[120px] text-zinc-100">
            {/* Top Tabs with scroll-based hiding */}
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
                    ) : showFollowingEmpty ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center justify-center py-16 text-center"
                        >
                            <div className="p-4 bg-zinc-900 rounded-full mb-4">
                                <Compass size={48} className="text-sky-400" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-200 mb-2">
                                {mounted ? dict.noFollowingYet : "You're not following anyone yet"}
                            </h3>
                            <p className="text-zinc-500 mb-6 max-w-sm">
                                {mounted ? dict.exploreToFindAnglers : "Explore to find anglers and see their catches in your feed"}
                            </p>
                            <button
                                onClick={() => setCurrentView('news')}
                                className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-colors"
                            >
                                {mounted ? dict.exploreNow : "Explore Now"}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="feed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4 w-full"
                        >
                            {feed.map((item, index) => {
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <FeedPostCard
                                            item={item}
                                            currentUserId={currentUser?.id}
                                            onDeleteSuccess={() => {
                                                setFeed(feed.filter(f => f.id !== item.id));
                                            }}
                                            onCommentClick={() => {
                                                openCommentModal(item);
                                            }}
                                        />
                                    </motion.div>
                                );
                            })}

                            {selectedPostForComment && (
                                <CommentModal
                                    isOpen={commentModalOpen}
                                    onClose={closeCommentModal}
                                    catchId={selectedPostForComment.id}
                                    postAuthor={selectedPostForComment.user}
                                    currentUserId={currentUser?.id}
                                    onCommentAdded={() => {
                                        fetchFeed(feedType);
                                    }}
                                />
                            )}

                            {feed.length === 0 && !showFollowingEmpty && (
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

            {/* Bottom Nav with scroll-based hiding */}
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

