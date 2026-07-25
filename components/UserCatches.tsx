"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Grid3x3, List, ArrowUpDown, X, Check } from 'lucide-react';
import { Sheet } from 'react-modal-sheet';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '@/lib/useI18n';
import { FeedPostCard } from '@/components/FeedPostCard';
import { useUserStore } from '@/stores/useUserStore';
import { CachedImage } from '@/components/CachedImage';
import { cn } from '@/lib/utils';

interface Catch {
    id: string;
    imageUrl: string | null;
    species: string | null;
    description: string | null;
    weight: number | null;
    length: number | null;
    isTextOnly?: boolean;
    isPinned?: boolean;
    createdAt: Date;
    _count: {
        likes: number;
        comments?: number;
        views?: number;
    };
}

interface User {
    id: string;
    firstName?: string | null;
    username?: string | null;
    photoUrl?: string | null;
    isPro?: boolean;
}

interface UserCatchesProps {
    catches: Catch[];
    viewMode?: string; // Make optional
    userId?: string;
    user?: User;
    onPinChange?: () => void;
}

type SortOption = 'newest' | 'oldest' | 'heaviest' | 'longest';

export const UserCatches: React.FC<UserCatchesProps> = ({ catches, viewMode: initialViewMode = 'list', userId, user, onPinChange }) => {
    const { dict } = useI18n();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>((initialViewMode as 'grid' | 'list') || 'list');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [showSortSheet, setShowSortSheet] = useState(false);
    const { userId: currentUserId } = useUserStore();

    // Backdrop state
    const [showBackdrop, setShowBackdrop] = useState(false);
    const closeTimerRef = React.useRef<number | null>(null);

    const openSmooth = () => {
        setShowBackdrop(true);
        requestAnimationFrame(() => {
            setShowSortSheet(true);
        });
    };

    const closeSmooth = () => {
        setShowSortSheet(false);
        if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
        }
        closeTimerRef.current = window.setTimeout(() => {
            setShowBackdrop(false);
            closeTimerRef.current = null;
        }, 320);
    };

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
        };
    }, []);

    const sortedCatches = useMemo(() => {
        const sorted = [...catches];
        
        // Separate pinned and unpinned catches
        const pinned = sorted.filter((c: any) => c.isPinned);
        const unpinned = sorted.filter((c: any) => !c.isPinned);
        
        // Sort unpinned catches based on selected sort option
        let sortedUnpinned = unpinned;
        switch (sortBy) {
            case 'newest':
                sortedUnpinned = unpinned.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case 'oldest':
                sortedUnpinned = unpinned.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                break;
            case 'heaviest':
                sortedUnpinned = unpinned.sort((a, b) => (b.weight || 0) - (a.weight || 0));
                break;
            case 'longest':
                sortedUnpinned = unpinned.sort((a, b) => (b.length || 0) - (a.length || 0));
                break;
        }
        
        // Sort pinned catches by createdAt desc (newest pinned first)
        const sortedPinned = pinned.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        // Return pinned first, then unpinned
        return [...sortedPinned, ...sortedUnpinned];
    }, [catches, sortBy]);

    const sortOptions: { id: SortOption; label: string }[] = [
        { id: 'newest', label: dict.newest || 'Newest' },
        { id: 'oldest', label: dict.oldest || 'Oldest' },
        { id: 'heaviest', label: dict.heaviest || 'Heaviest' },
        { id: 'longest', label: (dict as any).longest || dict.longestStreak || 'Longest' },
    ];

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-zinc-200">{dict.catches}</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={openSmooth}
                        className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
                    >
                        <ArrowUpDown size={20} className="text-zinc-400" />
                    </button>
                    <div className="flex bg-zinc-900 rounded-lg border border-zinc-800 p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-1.5 rounded-md transition-colors",
                                viewMode === 'grid' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <Grid3x3 size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-1.5 rounded-md transition-colors",
                                viewMode === 'list' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-3 gap-2">
                    {sortedCatches.map((item) => {
                        const isTextOnly = item.isTextOnly || false;
                        return (
                            <div
                                key={item.id}
                                className="aspect-square relative rounded-lg overflow-visible bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors group"
                            >
                                <div className="w-full h-full overflow-hidden rounded-lg">
                                    <Link href={`/catch/${item.id}`} className="block w-full h-full">
                                        {isTextOnly ? (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs text-center p-2">
                                                <span className="line-clamp-3">{item.description || 'Text Post'}</span>
                                            </div>
                                        ) : item.imageUrl ? (
                                            <CachedImage
                                                src={item.imageUrl}
                                                alt={item.species || 'Catch'}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs text-center p-2">
                                                {item.species || 'Text Post'}
                                            </div>
                                        )}
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedCatches.map((item) => {
                        const feedPostItem = {
                            id: item.id,
                            userId: userId || '',
                            user: user || {
                                id: userId || '',
                                firstName: null,
                                username: null,
                                photoUrl: null,
                                isPro: false,
                            },
                            species: item.species,
                            imageUrl: item.imageUrl,
                            description: item.description,
                            isTextOnly: item.isTextOnly,
                            createdAt: item.createdAt,
                            _count: {
                                likes: item._count.likes,
                                comments: item._count?.comments || 0,
                                views: item._count?.views || 0,
                            },
                            reactions: (item as any).reactions || [],
                            isPinned: (item as any).isPinned || false,
                        };

                        return (
                            <FeedPostCard
                                key={item.id}
                                item={feedPostItem}
                                currentUserId={currentUserId}
                                showReplyIndicator={false}
                                onDeleteSuccess={onPinChange}
                                onPinChange={onPinChange}
                            />
                        );
                    })}
                </div>
            )}

            {catches.length === 0 && (
                <div className="text-center py-10 text-zinc-600">
                    <p>{dict.noCatches}</p>
                </div>
            )}

            {/* Sort Sheet */}
            {showBackdrop && (
                <div
                    onClick={closeSmooth}
                    className="fixed inset-0 z-[90] transition-opacity duration-300 pointer-events-auto"
                    style={{
                        opacity: showSortSheet ? 1 : 0,
                        backgroundColor: showSortSheet ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                    }}
                />
            )}

            <Sheet
                isOpen={showSortSheet}
                onClose={closeSmooth}
                snapPoints={[0, 0.4, 1]}
                initialSnap={1}
                style={{ zIndex: 100 }}
            >
                <Sheet.Container
                    style={{
                        backgroundColor: '#18181b',
                        borderTopLeftRadius: '24px',
                        borderTopRightRadius: '24px',
                        borderColor: 'rgb(39, 39, 42)',
                        borderWidth: '1px',
                    }}
                >
                    <Sheet.Header>
                        <div className="flex justify-center py-3">
                            <div className="w-12 h-1.5 bg-zinc-600 rounded-full" />
                        </div>
                        <div className="px-4 pb-2 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-zinc-100">{dict.sortBy || "Sort by"}</h3>
                            <button onClick={closeSmooth} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </Sheet.Header>
                    <Sheet.Content>
                        <div className="p-4 space-y-1">
                            {sortOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        setSortBy(option.id);
                                        closeSmooth();
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between p-3 rounded-xl transition-colors",
                                        sortBy === option.id
                                            ? "bg-sky-500/10 text-sky-500"
                                            : "text-zinc-300 hover:bg-zinc-800/50"
                                    )}
                                >
                                    <span className="font-medium">{option.label}</span>
                                    {sortBy === option.id && (
                                        <Check size={18} className="text-sky-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </Sheet.Content>
                </Sheet.Container>
            </Sheet>
        </div>
    );
};

