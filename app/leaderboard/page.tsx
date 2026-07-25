"use client";

import React, { useEffect, useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import Link from 'next/link';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardUser {
    id: string;
    firstName: string | null;
    username: string | null;
    photoUrl: string | null;
    isPro?: boolean;
    totalWeight: number;
    _count: {
        catches: number;
        followers: number;
    };
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/leaderboard?category=total')
            .then(res => res.json())
            .then(data => {
                setLeaderboard(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching leaderboard:', err);
                setLoading(false);
            });
    }, []);

    const getMedalIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="text-yellow-400" size={24} />;
        if (rank === 2) return <Medal className="text-zinc-400" size={24} />;
        if (rank === 3) return <Award className="text-orange-600" size={24} />;
        return null;
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-zinc-950 pb-[80px] text-zinc-100">
                <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 sticky top-0 z-30">
                    <h1 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                        <Trophy size={24} />
                        Leaderboard
                    </h1>
                </header>
                <main className="flex-1 p-4 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-zinc-400">Loading leaderboard...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-zinc-950 pb-[80px] text-zinc-100">
            <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 sticky top-0 z-30">
                <h1 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                    <Trophy size={24} />
                    Leaderboard
                </h1>
            </header>

            <main className="flex-1 p-4">
                {/* Top 3 Podium */}
                {leaderboard.length >= 3 && (
                    <div className="flex items-end justify-center gap-2 mb-6 px-4">
                        {/* 2nd Place */}
                        <Link href={`/user/${leaderboard[1].id}`} className="flex flex-col items-center flex-1">
                            <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden border-2 border-zinc-400 mb-2">
                                {leaderboard[1].photoUrl ? (
                                    <img src={leaderboard[1].photoUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-500">?</div>
                                )}
                            </div>
                            <Medal className="text-zinc-400 mb-1" size={20} />
                            <div className="text-xs text-zinc-400 text-center truncate w-full">
                                {leaderboard[1].firstName || leaderboard[1].username}
                            </div>
                            <div className="text-sm font-bold text-zinc-200">{leaderboard[1].totalWeight.toFixed(1)}kg</div>
                            <div className="bg-zinc-800 h-20 w-full rounded-t-lg mt-2 border-t-2 border-zinc-400"></div>
                        </Link>

                        {/* 1st Place */}
                        <Link href={`/user/${leaderboard[0].id}`} className="flex flex-col items-center flex-1">
                            <div className="w-20 h-20 rounded-full bg-zinc-800 overflow-hidden border-4 border-yellow-400 mb-2">
                                {leaderboard[0].photoUrl ? (
                                    <img src={leaderboard[0].photoUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-500">?</div>
                                )}
                            </div>
                            <Trophy className="text-yellow-400 mb-1" size={24} />
                            <div className="text-xs text-zinc-200 text-center truncate w-full font-semibold">
                                {leaderboard[0].firstName || leaderboard[0].username}
                            </div>
                            <div className="text-lg font-bold text-yellow-400">{leaderboard[0].totalWeight.toFixed(1)}kg</div>
                            <div className="bg-gradient-to-t from-yellow-900/30 to-yellow-700/30 h-28 w-full rounded-t-lg mt-2 border-t-4 border-yellow-400"></div>
                        </Link>

                        {/* 3rd Place */}
                        <Link href={`/user/${leaderboard[2].id}`} className="flex flex-col items-center flex-1">
                            <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden border-2 border-orange-600 mb-2">
                                {leaderboard[2].photoUrl ? (
                                    <img src={leaderboard[2].photoUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-500">?</div>
                                )}
                            </div>
                            <Award className="text-orange-600 mb-1" size={20} />
                            <div className="text-xs text-zinc-400 text-center truncate w-full">
                                {leaderboard[2].firstName || leaderboard[2].username}
                            </div>
                            <div className="text-sm font-bold text-zinc-200">{leaderboard[2].totalWeight.toFixed(1)}kg</div>
                            <div className="bg-zinc-800 h-16 w-full rounded-t-lg mt-2 border-t-2 border-orange-600"></div>
                        </Link>
                    </div>
                )}

                {/* Rest of Leaderboard */}
                <div className="space-y-2">
                    {leaderboard.slice(3).map((user, index) => {
                        const rank = index + 4;
                        return (
                            <Link
                                key={user.id}
                                href={`/user/${user.id}`}
                                className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-colors"
                            >
                                <div className="w-8 text-center font-bold text-zinc-500">
                                    #{rank}
                                </div>
                                <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                                    {user.photoUrl ? (
                                        <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-500">?</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-zinc-200 truncate flex items-center gap-2">
                                        {user.firstName || user.username || 'Angler'}
                                        {user.isPro && (
                                            <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/30">
                                                PRO
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                        {user._count.catches} catches • {user._count.followers} followers
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-lg text-zinc-200">{user.totalWeight.toFixed(1)}</div>
                                    <div className="text-xs text-zinc-500">kg</div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {leaderboard.length === 0 && (
                    <div className="text-center py-10 text-zinc-600">
                        <p>No anglers yet</p>
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
}

