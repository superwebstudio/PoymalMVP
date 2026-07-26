"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, Sparkles, TrendingUp } from 'lucide-react';
import { useI18n } from '@/lib/useI18n';
import { CachedImage } from '@/components/CachedImage';

type TopCatch = {
  id: string;
  species: string | null;
  imageUrl: string | null;
  weight: number | null;
  user?: {
    firstName: string | null;
    username: string | null;
    isPro?: boolean;
  };
  _count?: {
    likes?: number;
  };
};

export const NewsContent = () => {
  const { dict } = useI18n();
  const [topCatches, setTopCatches] = useState<TopCatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/discover/top-catches')
      .then(async (res) => {
        const data: unknown = await res.json();
        if (!res.ok || !Array.isArray(data)) {
          throw new Error(
            typeof data === 'object' &&
              data !== null &&
              'error' in data &&
              typeof (data as { error: unknown }).error === 'string'
              ? (data as { error: string }).error
              : 'Failed to load top catches'
          );
        }
        if (!cancelled) {
          setTopCatches(data as TopCatch[]);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        console.error(err);
        if (!cancelled) {
          setTopCatches([]);
          setError(err instanceof Error ? err.message : 'Failed to load');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-zinc-800 rounded" />
            <div className="h-5 w-48 bg-zinc-800 rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                <div className="w-20 h-20 rounded-lg bg-zinc-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-zinc-800 rounded" />
                  <div className="h-3 w-24 bg-zinc-800 rounded" />
                  <div className="h-3 w-20 bg-zinc-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-8 text-center text-sm text-zinc-400">
        {error}
      </div>
    );
  }

  if (topCatches.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-8 text-center text-sm text-zinc-400">
        {dict.noCatches || 'No catches yet'}. {dict.beFirst || 'Be the first to post!'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Flame className="text-orange-400" size={20} />
          <h2 className="font-bold text-lg text-zinc-200">{dict.topCatchesThisWeek}</h2>
        </div>
        <div className="space-y-3">
          {topCatches.slice(0, 5).map((item) => {
            const likesCount = item?._count?.likes ?? 0;
            return (
              <Link
                key={item.id}
                href={`/catch/${item.id}`}
                className="flex gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-colors"
              >
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                  {item.imageUrl && (
                    <CachedImage
                      src={item.imageUrl}
                      alt={item.species || 'Catch'}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-zinc-200 truncate">
                      {item.species || 'Post'}
                    </h3>
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
                    <span>
                      {likesCount} {dict.likes}
                    </span>
                    {item.weight ? <span>{item.weight}kg</span> : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {topCatches.length > 5 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="text-purple-400" size={20} />
            <h2 className="font-bold text-lg text-zinc-200">{dict.rareSpecies}</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {topCatches.slice(5, 11).map((item) => (
              <Link
                key={item.id}
                href={`/catch/${item.id}`}
                className="aspect-square relative rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                {item.imageUrl && (
                  <CachedImage
                    src={item.imageUrl}
                    alt={item.species || 'Catch'}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                  <p className="text-white text-[10px] font-medium text-center truncate">
                    {item.species}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="text-green-400" size={20} />
          <h2 className="font-bold text-lg text-zinc-200">{dict.suggestedUsers}</h2>
        </div>
        <div className="text-center py-6 text-zinc-500 text-sm">Coming soon...</div>
      </section>
    </div>
  );
};
