"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, MapPin, Sparkles, TrendingUp } from 'lucide-react';
import { useI18n } from '@/lib/useI18n';
import { CachedImage } from '@/components/CachedImage';

export const NewsContent = () => {
  const { dict } = useI18n();
  const [topCatches, setTopCatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/discover/top-catches')
      .then(res => res.json())
      .then(data => {
        setTopCatches(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton for Top Catches */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-zinc-800 rounded"></div>
            <div className="h-5 w-48 bg-zinc-800 rounded"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                <div className="w-20 h-20 rounded-lg bg-zinc-800 flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-zinc-800 rounded"></div>
                  <div className="h-3 w-24 bg-zinc-800 rounded"></div>
                  <div className="h-3 w-20 bg-zinc-800 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* Skeleton for Rare Species */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-zinc-800 rounded"></div>
            <div className="h-5 w-40 bg-zinc-800 rounded"></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-zinc-900 border border-zinc-800 rounded-lg"></div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Catches This Week */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Flame className="text-orange-400" size={20} />
          <h2 className="font-bold text-lg text-zinc-200">{dict.topCatchesThisWeek}</h2>
        </div>
        <div className="space-y-3">
          {topCatches.slice(0, 5).map((item: any) => {
            // Get likes count from _count.likes (from API) or fallback to 0
            const likesCount = item?._count?.likes ?? 0;
            return (
              <Link
                key={item.id}
                href={`/catch/${item.id}`}
                className="flex gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-colors"
              >
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                  {item.imageUrl && (
                    <CachedImage src={item.imageUrl} alt={item.species} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-zinc-200 truncate">{item.species || 'Post'}</h3>
                    {item.user?.isPro && (
                      <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/30">
                        PRO
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400">
                    by {item.user?.firstName || item.user?.username || 'Unknown'}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                    <span>{likesCount} {dict.likes}</span>
                    {item.weight && <span>{item.weight}kg</span>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Rare Species */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="text-purple-400" size={20} />
          <h2 className="font-bold text-lg text-zinc-200">{dict.rareSpecies}</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {topCatches.slice(5, 11).map((item: any) => (
            <Link
              key={item.id}
              href={`/catch/${item.id}`}
              className="aspect-square relative rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              {item.imageUrl && (
                <CachedImage src={item.imageUrl} alt={item.species} className="w-full h-full object-cover" />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                <p className="text-white text-[10px] font-medium text-center truncate">{item.species}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Suggested Users */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="text-green-400" size={20} />
          <h2 className="font-bold text-lg text-zinc-200">{dict.suggestedUsers}</h2>
        </div>
        <div className="text-center py-6 text-zinc-500 text-sm">
          Coming soon...
        </div>
      </section>
    </div>
  );
};

