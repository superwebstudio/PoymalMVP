"use client";

import React from 'react';
import { useI18n } from '@/lib/useI18n';
import { Settings, Lock } from 'lucide-react';
import Link from 'next/link';
import { UserStats } from '@/components/UserStats';
import { UserCatches } from '@/components/UserCatches';
import { useProfileStore } from '@/stores/useProfileStore';
import { useUserStore } from '@/stores/useUserStore';
import { usePreferencesStore } from '@/stores/usePreferencesStore';
import { CachedImage } from '@/components/CachedImage';
import { ProAvatarBadge } from '@/components/ProAvatarBadge';

const getCountryFlag = (country: string | null) => {
    if (!country) return '🌍';
    const flags: Record<string, string> = {
        'Russia': '🇷🇺',
        'USA': '🇺🇸',
        'Canada': '🇨🇦',
        'UK': '🇬🇧',
        'Germany': '🇩🇪',
        'France': '🇫🇷',
    };
    return flags[country] || '🌍';
};

export function ProfilePageContent() {
    const { dict } = useI18n();
    const { user } = useProfileStore();
    const { userId } = useUserStore();
    const preferences = usePreferencesStore((state) => state.preferences);

    if (!user) {
        return (
            <div className="flex flex-col min-h-screen bg-zinc-950 pb-[80px] text-zinc-100">
                <div className="flex flex-1 items-center justify-center">
                    <Link
                        href="/login?next=/profile"
                        className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-500"
                    >
                        Sign in to view your profile
                    </Link>
                </div>
            </div>
        );
    }

    const catches = user.catches || [];
    const totalWeight = catches.reduce((sum, c) => sum + (c.weight || 0), 0);
    const avgWeight = catches.length > 0 ? totalWeight / catches.length : 0;

    // Use preferences from store for current user's own profile
    const isOwnProfile = userId === user.id;
    const showTelegramHandle = isOwnProfile 
        ? (preferences?.showTelegramHandle ?? user.showTelegramHandle ?? true)
        : (user.showTelegramHandle ?? true);
    const showCountryBadge = isOwnProfile
        ? (preferences?.showCountryBadge ?? user.showCountryBadge ?? true)
        : (user.showCountryBadge ?? true);

    return (
        <div className="flex flex-col min-h-screen bg-zinc-950 pb-[80px] text-zinc-100">
            {/* Profile Header */}
            <div className="bg-zinc-900 border-b border-zinc-800 p-6">
                <div className="flex justify-between items-start mb-4">
                    <h1 className="text-2xl font-bold">{dict.profile}</h1>
                    <Link href="/settings" className="p-2 rounded-full hover:bg-zinc-800 transition-colors">
                        <Settings size={24} className="text-zinc-400" />
                    </Link>
                </div>

                <div className="flex items-start gap-4">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-zinc-800 overflow-hidden border-2 border-zinc-700">
                            {user.photoUrl ? (
                                <CachedImage
                                    src={user.photoUrl}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-600 text-2xl">
                                    {user.firstName?.[0] || user.username?.[0] || '?'}
                                </div>
                            )}
                        </div>
                        {user.isPro && <ProAvatarBadge size="md" />}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl font-semibold text-white">
                                {user.firstName || user.username || dict.angler}
                            </h2>
                            {user.country && showCountryBadge && (
                                <span className="text-xl">{getCountryFlag(user.country)}</span>
                            )}
                        </div>
                        {user.username && (
                            showTelegramHandle ? (
                                <p className="text-zinc-500 text-sm">@{user.username}</p>
                            ) : (
                                <p className="text-zinc-500 text-sm flex items-center gap-1">
                                    <Lock size={12} className="text-zinc-600" /> Hidden
                                </p>
                            )
                        )}

                        <div className="flex gap-4 mt-3 text-sm">
                            <div>
                                <span className="font-bold text-zinc-100">{user._count?.followers || 0}</span>
                                <span className="text-zinc-500 ml-1">{dict.followers}</span>
                            </div>
                            <div>
                                <span className="font-bold text-zinc-100">{user._count?.following || 0}</span>
                                <span className="text-zinc-500 ml-1">{dict.following}</span>
                            </div>
                        </div>
                        {!user.isPro && (
                            <Link
                                href="/pro"
                                className="mt-2 inline-flex items-center gap-1.5 text-xs bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 text-yellow-400 px-2.5 py-1 rounded-full hover:border-yellow-500/50 transition-colors"
                            >
                                <img
                                    src="/logo-min-gold.svg"
                                    alt="Ulov"
                                    className="h-3 w-3"
                                />
                                {dict.upgradeToPro || 'Upgrade to PRO'}
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <UserStats
                totalCatches={catches.length}
                totalWeight={totalWeight}
                avgWeight={avgWeight}
            />

            {/* Catches */}
            <UserCatches
                catches={catches}
                userId={user.id}
                user={{
                    id: user.id,
                    firstName: user.firstName,
                    username: user.username,
                    photoUrl: user.photoUrl,
                    isPro: user.isPro,
                }}
            />
        </div>
    );
}

