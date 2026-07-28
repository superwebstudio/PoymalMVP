"use client";

import React from 'react';
import { useI18n } from '@/lib/useI18n';
import { Settings, Bell, Camera } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { UserStats } from '@/components/UserStats';
import { UserCatches } from '@/components/UserCatches';
import { useProfileStore } from '@/stores/useProfileStore';
import { useUserStore } from '@/stores/useUserStore';
import { usePreferencesStore } from '@/stores/usePreferencesStore';
import { CachedImage } from '@/components/CachedImage';
import { ProAvatarBadge } from '@/components/ProAvatarBadge';
import { useImageCompression } from '@/hooks/useImageCompression';
import { useNotificationStore } from '@/stores/useNotificationStore';

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
    const { user, setUser } = useProfileStore();
    const { userId, setCurrentUser, currentUser, fetchUser } = useUserStore();
    const preferences = usePreferencesStore((state) => state.preferences);
    const { compressImage } = useImageCompression();
    const { addNotification } = useNotificationStore();
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
    const showCountryBadge = isOwnProfile
        ? (preferences?.showCountryBadge ?? user.showCountryBadge ?? true)
        : (user.showCountryBadge ?? true);

    const handleAvatarChange = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ): Promise<void> => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file || !userId || !isOwnProfile) return;

        setUploadingPhoto(true);
        try {
            const compressed = await compressImage(file);
            const avatarFile = new File([compressed], 'avatar.jpg', { type: 'image/jpeg' });
            const formData = new FormData();
            formData.append('file', avatarFile);
            formData.append('folder', 'avatars');

            const uploadResponse = await fetch('/api/upload-supabase', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            const uploadData = (await uploadResponse.json()) as {
                url?: string;
                error?: string;
            };
            if (!uploadResponse.ok || !uploadData.url) {
                throw new Error(uploadData.error || 'Upload failed');
            }

            const response = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ photoUrl: uploadData.url }),
            });
            const data = (await response.json()) as {
                error?: string;
                user?: { photoUrl: string | null };
            };
            if (!response.ok || !data.user) {
                throw new Error(data.error || 'Unable to update photo');
            }

            setUser({ ...user, photoUrl: data.user.photoUrl });
            if (currentUser) {
                setCurrentUser({ ...currentUser, photoUrl: data.user.photoUrl });
            }
            await fetchUser(userId);
            addNotification({ message: 'Profile photo updated', type: 'success' });
        } catch (error) {
            console.error('Avatar upload error:', error);
            addNotification({
                message: error instanceof Error ? error.message : 'Unable to update photo',
                type: 'error',
            });
        } finally {
            setUploadingPhoto(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-zinc-950 pb-[80px] text-zinc-100">
            {/* Profile Header */}
            <div className="bg-zinc-900 border-b border-zinc-800 p-6">
                <div className="flex justify-between items-start mb-4">
                    <h1 className="text-2xl font-bold">{dict.profile}</h1>
                    <div className="flex items-center gap-1">
                        {isOwnProfile && (
                            <Link href="/notifications" className="p-2 rounded-full hover:bg-zinc-800 transition-colors" aria-label="Notifications">
                                <Bell size={22} className="text-zinc-400" />
                            </Link>
                        )}
                        <Link href="/settings" className="p-2 rounded-full hover:bg-zinc-800 transition-colors" aria-label="Settings">
                            <Settings size={24} className="text-zinc-400" />
                        </Link>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="relative">
                        {isOwnProfile ? (
                            <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={uploadingPhoto}
                                className="relative w-20 h-20 rounded-full bg-zinc-800 overflow-hidden border-2 border-zinc-700"
                                aria-label="Change profile photo"
                            >
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
                                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/55 py-1 text-white">
                                    <Camera size={14} />
                                </span>
                            </button>
                        ) : (
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
                        )}
                        {user.isPro && <ProAvatarBadge size="md" />}
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
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
                            <p className="text-zinc-500 text-sm">@{user.username}</p>
                        )}

                        <div className="flex gap-4 mt-3 text-sm">
                            <Link
                                href={`/user/${user.id}/follows?type=followers`}
                                className="hover:opacity-80 transition-opacity"
                            >
                                <span className="font-bold text-zinc-100">{user._count?.followers || 0}</span>
                                <span className="text-zinc-500 ml-1">{dict.followers}</span>
                            </Link>
                            <Link
                                href={`/user/${user.id}/follows?type=following`}
                                className="hover:opacity-80 transition-opacity"
                            >
                                <span className="font-bold text-zinc-100">{user._count?.following || 0}</span>
                                <span className="text-zinc-500 ml-1">{dict.following}</span>
                            </Link>
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

