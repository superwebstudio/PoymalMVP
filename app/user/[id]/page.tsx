"use client";

import React, { useEffect, useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Settings } from 'lucide-react';
import { FollowButton } from '@/components/FollowButton';
import { UserStats } from '@/components/UserStats';
import { UserCatches } from '@/components/UserCatches';
import { useI18n } from '@/lib/useI18n';
import { getCountryFlag } from '@/types';
import { TelegramBackButton } from '@/components/TelegramBackButton';
import { useUserStore } from '@/stores/useUserStore';
import { usePreferencesStore } from '@/stores/usePreferencesStore';
import { CachedImage } from '@/components/CachedImage';

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { dict } = useI18n();
    const router = useRouter();
    const { userId: currentUserIdFromStore } = useUserStore();
    const preferences = usePreferencesStore((state) => state.preferences);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchParams = async () => {
            const resolvedParams = await params;
            setUserId(resolvedParams.id);
        };
        fetchParams();
    }, [params]);

    useEffect(() => {
        if (!userId) return;

        const fetchData = async () => {
            try {
                // Fetch user profile
                const response = await fetch(`/api/user/${userId}`);
                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);

                    // Check if following (only if not own profile)
                    if (currentUserIdFromStore && currentUserIdFromStore !== userId) {
                        try {
                            const followResponse = await fetch(`/api/follow?followerId=${currentUserIdFromStore}&followingId=${userId}`);
                            if (followResponse.ok) {
                                const followData = await followResponse.json();
                                setIsFollowing(followData.isFollowing || false);
                            }
                        } catch (e) {
                            // Follow check failed
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching user:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    const isOwnProfile = currentUserIdFromStore === user?.id;

    // Redirect to own profile page if viewing own profile
    useEffect(() => {
        if (isOwnProfile && !loading && user) {
            router.replace('/profile');
        }
    }, [isOwnProfile, loading, router, user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-950">
                <div className="text-center">
                    <Link href="/" className="inline-block" aria-label="Poymal home">
                        <img
                            src="/logo-max.svg"
                            alt="Poymal"
                            className="mx-auto mb-6 h-16 opacity-90"
                        />
                    </Link>
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-zinc-400">{dict.loading}</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-950">
                <p className="text-zinc-400">{dict.userNotFound || 'User not found'}</p>
            </div>
        );
    }

    if (isOwnProfile) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-950">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-zinc-400">{dict.loading}</p>
                </div>
            </div>
        );
    }

    const catches = user.catches || [];
    const totalWeight = catches.reduce((sum: number, c: any) => sum + (c.weight || 0), 0);
    const avgWeight = catches.length > 0 ? totalWeight / catches.length : 0;

    return (
        <div className="flex flex-col min-h-screen bg-zinc-950 pb-[80px] text-zinc-100">
            <TelegramBackButton />
            <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="text-zinc-400 hover:text-zinc-200">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-zinc-200">
                        {user.firstName || user.username || 'Angler'}
                    </h1>
                </div>
                {isOwnProfile && (
                    <Link href="/settings" className="text-zinc-400 hover:text-zinc-200">
                        <Settings size={24} />
                    </Link>
                )}
            </header>

            <main className="flex-1">
                {/* Profile Header */}
                <div className="bg-zinc-900 border-b border-zinc-800 p-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-zinc-800 overflow-hidden border-2 border-zinc-700">
                                {user.photoUrl ? (
                                    <CachedImage
                                      src={user.photoUrl}
                                      alt="Profile"
                                      className="h-full w-full"
                                      sizes="80px"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-2xl">
                                        ?
                                    </div>
                                )}
                            </div>
                            {user.isPro && (
                                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-zinc-900">
                                    PRO
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-xl font-bold text-zinc-100">
                                    {user.firstName || user.username || 'Angler'}
                                </h2>
                                {user.country && (() => {
                                    const showCountryBadge = isOwnProfile
                                        ? (preferences?.showCountryBadge ?? user.showCountryBadge ?? true)
                                        : (user.showCountryBadge ?? true);
                                    return showCountryBadge && (
                                        <span className="text-xl">{getCountryFlag(user.country)}</span>
                                    );
                                })()}
                            </div>
                            {user.username && (
                                <p className="text-zinc-500 text-sm">@{user.username}</p>
                            )}

                            <div className="flex gap-4 mt-3 text-sm">
                                <Link
                                    href={`/user/${user.id}/follows?type=followers`}
                                    className="hover:opacity-80 transition-opacity"
                                >
                                    <span className="font-bold text-zinc-100">{user._count.followers}</span>
                                    <span className="text-zinc-500 ml-1">{dict.followers}</span>
                                </Link>
                                <Link
                                    href={`/user/${user.id}/follows?type=following`}
                                    className="hover:opacity-80 transition-opacity"
                                >
                                    <span className="font-bold text-zinc-100">{user._count.following}</span>
                                    <span className="text-zinc-500 ml-1">{dict.following}</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {!isOwnProfile && currentUserIdFromStore && (
                        <FollowButton
                            userId={user.id}
                            isFollowing={isFollowing}
                            currentUserId={currentUserIdFromStore}
                        />
                    )}
                </div>

                {/* Stats */}
                <UserStats
                    totalCatches={catches.length}
                    totalWeight={totalWeight}
                    avgWeight={avgWeight}
                />

                {/* Catches */}
                <UserCatches catches={catches} userId={user.id} user={user} />
            </main>

            <BottomNav />
        </div>
    );
}

