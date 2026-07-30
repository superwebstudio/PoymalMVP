"use client";

import React, { useEffect, useRef } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { useI18n } from '@/lib/useI18n';
import { Settings, Gift } from 'lucide-react';
import Link from 'next/link';
import { UserStats } from '@/components/UserStats';
import { UserCatches } from '@/components/UserCatches';
import { GuestAccountCTA } from '@/components/GuestAccountCTA';
import { useProfileStore } from '@/stores/useProfileStore';
import { useUserStore } from '@/stores/useUserStore';
import { usePreferencesStore } from '@/stores/usePreferencesStore';
import { getCountryFlag } from '@/types';
import { ProAvatarBadge } from '@/components/ProAvatarBadge';
import { CachedImage } from '@/components/CachedImage';

interface ProfilePageClientProps {
    initialUser: {
        id: string;
        firstName?: string | null;
        username?: string | null;
        photoUrl?: string | null;
        isPro?: boolean;
        country?: string | null;
        showCountryBadge?: boolean | null;
        catches?: Array<{
            id: string;
            weight?: number | null;
            isPinned?: boolean;
            createdAt: string | Date;
        }>;
        _count?: {
            followers?: number;
            following?: number;
        };
    } | null;
}

export default function ProfilePageClient({ initialUser }: ProfilePageClientProps) {
    const { dict } = useI18n();
    const { user, loading, fetchUser, setUser } = useProfileStore();
    const { userId } = useUserStore();
    const preferences = usePreferencesStore((state) => state.preferences);

    const initializedRef = useRef(false);
    useEffect(() => {
        if (!initializedRef.current) {
            if (initialUser) {
                setUser(initialUser as never);
            } else if (userId && !user) {
                fetchUser(userId);
            }
            initializedRef.current = true;
        }
    }, [initialUser, userId, setUser, fetchUser, user]);

    if (!userId && !initialUser) {
        return <GuestAccountCTA variant="profile" />;
    }

    const displayUser = user || initialUser;

    const catches = React.useMemo(() => {
        const allCatches = displayUser?.catches || [];
        return [...allCatches].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [displayUser?.catches]);

    if (loading && !user && !initialUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-950">
                <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!displayUser) {
        return <GuestAccountCTA variant="profile" />;
    }

    const isOwnProfile = userId === displayUser.id;
    const showCountryBadge = isOwnProfile
        ? (preferences?.showCountryBadge ?? displayUser.showCountryBadge ?? true)
        : (displayUser.showCountryBadge ?? true);

    const totalWeight = catches.reduce((sum, c) => sum + (c.weight || 0), 0);
    const avgWeight = catches.length > 0 ? totalWeight / catches.length : 0;

    return (
        <div className="flex flex-col min-h-screen bg-zinc-950 pb-[80px] text-zinc-100">
            <div className="bg-zinc-900 border-b border-zinc-800 p-6">
                <div className="flex items-center gap-4">
                    <div className="relative ">
                        <div className="w-20 h-20 rounded-full bg-zinc-800 overflow-hidden border-2 border-zinc-700">
                            {displayUser.photoUrl ? (
                                <CachedImage
                                  src={displayUser.photoUrl}
                                  alt="Profile"
                                  className="h-full w-full"
                                  sizes="80px"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-600 text-2xl">
                                    {displayUser.firstName?.[0] || displayUser.username?.[0] || '?'}
                                </div>
                            )}
                        </div>
                        {displayUser.isPro && <ProAvatarBadge size="md" />}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-semibold text-white">
                                    {displayUser.firstName || displayUser.username || dict.angler}
                                </h2>
                                {displayUser.country && showCountryBadge && (
                                    <span className="text-xl">{getCountryFlag(displayUser.country)}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {isOwnProfile && (
                                    <Link href="/referrals" className="p-2 rounded-full hover:bg-zinc-800 transition-colors" title={dict.inviteFriends || 'Invite Friends'}>
                                        <Gift size={24} className="text-yellow-400" />
                                    </Link>
                                )}
                                <Link href="/settings" className="p-2 rounded-full hover:bg-zinc-800 transition-colors">
                                    <Settings size={24} className="text-zinc-400" />
                                </Link>
                            </div>
                        </div>
                        {displayUser.username && (
                            <p className="text-zinc-500 text-sm">@{displayUser.username}</p>
                        )}
                        {!displayUser.isPro && (
                            <Link
                                href="/pro"
                                className="mt-2 inline-flex items-center gap-1.5 text-xs bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 text-yellow-400 px-2.5 py-1 rounded-full hover:border-yellow-500/50 transition-colors"
                            >
                                <img
                                    src="/logo-min-gold.svg"
                                    alt="Poymal"
                                    className="h-3 w-3"
                                />
                                {dict.upgradeToPro || 'Get PRO'}
                            </Link>
                        )}
                        <div className="flex gap-4 mt-3 text-sm">
                            <Link
                                href={`/user/${displayUser.id}/follows?type=followers`}
                                className="hover:opacity-80 transition-opacity"
                            >
                                <span className="font-bold text-zinc-100">{displayUser._count?.followers || 0}</span>
                                <span className="text-zinc-500 ml-1">{dict.followers}</span>
                            </Link>
                            <Link
                                href={`/user/${displayUser.id}/follows?type=following`}
                                className="hover:opacity-80 transition-opacity"
                            >
                                <span className="font-bold text-zinc-100">{displayUser._count?.following || 0}</span>
                                <span className="text-zinc-500 ml-1">{dict.following}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <UserStats
                totalCatches={catches.length}
                totalWeight={totalWeight}
                avgWeight={avgWeight}
            />

            <UserCatches
                catches={catches as never}
                viewMode="list"
                userId={displayUser.id}
                user={{
                    id: displayUser.id,
                    firstName: displayUser.firstName,
                    username: displayUser.username,
                    photoUrl: displayUser.photoUrl,
                    isPro: displayUser.isPro,
                }}
                onPinChange={() => {
                    if (userId && userId === displayUser.id) {
                        fetchUser(userId);
                    }
                }}
            />

            <BottomNav />
        </div>
    );
}
